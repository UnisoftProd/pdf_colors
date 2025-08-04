from flask import Flask, request, send_file, send_from_directory
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
import io
from flask_cors import CORS
import os


app = Flask(__name__, static_folder='static')
CORS(app)
pdfmetrics.registerFont(TTFont('Roboto', 'Roboto-Regular.ttf'))

def cmyk_variants(base_cmyk, deviation):
    steps = [-deviation, 0, deviation]
    variants = []
    for y in steps:
        for k in steps:
            group = []
            for c in steps:
                for m in steps:
                    group.append({
                        'c': min(max(base_cmyk['c'] + c, 0), 100),
                        'm': min(max(base_cmyk['m'] + m, 0), 100),
                        'y': min(max(base_cmyk['y'] + y, 0), 100),
                        'k': min(max(base_cmyk['k'] + k, 0), 100),
                        'dc': c,
                        'dm': m,
                        'dy': y,
                        'dk': k
                    })
            variants.append(group)
    return variants

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    data = request.json
    cmyk = data['cmyk']
    deviation = int(data['deviation'])
    raw_comment = data.get('comment', '')
    pantone = data.get('pantone', '')

    # 1. Подготовка комментария
    comment_lines = []
    if raw_comment:
        temp_buffer = io.BytesIO()
        temp_canvas = canvas.Canvas(temp_buffer)
        temp_canvas.setFont("Roboto", 12)
        max_width = 700
        
        for line in raw_comment.split('\n'):
            words = line.split()
            current_line = []
            
            for word in words:
                test_line = ' '.join(current_line + [word])
                if temp_canvas.stringWidth(test_line, "Roboto", 12) <= max_width:
                    current_line.append(word)
                else:
                    if current_line:
                        comment_lines.append(' '.join(current_line))
                    current_line = [word]
            
            if current_line:
                comment_lines.append(' '.join(current_line))

    # 2. Создание PDF
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(836, 1097))
    
    # 3. Параметры сетки
    cell_size = 44
    gap_x = 12
    gap_y = 24
    group_gap_x = 40
    group_gap_y = 64
    
    # 4. Расчет высот блоков
    title_block_height = 30 + (24 if pantone else 0)
    comment_block_height = len(comment_lines) * 15 + (90 if comment_lines else 0)  # Увеличенные отступы
    grid_block_height = 3 * (3 * cell_size + 2 * gap_y) + 2 * group_gap_y
    
    # 5. Точное центрирование
    total_content_height = title_block_height + comment_block_height + grid_block_height
    vertical_offset = (1097 - total_content_height) / 2
    current_y = 1097 - vertical_offset  # Начинаем с верхней границы контента
    
    # 6. Заголовок
    c.setFont("Roboto", 22)
    current_y -= 30
    if pantone:
        c.drawCentredString(418, current_y, f"{pantone} (Шаг: {deviation})")
        current_y -= 24
        c.setFont("Roboto", 15)
        c.drawCentredString(418, current_y, f"C:{round(cmyk['c'])} M:{round(cmyk['m'])} Y:{round(cmyk['y'])} K:{round(cmyk['k'])}")
    else:
        c.drawCentredString(418, current_y, f"CMYK {round(cmyk['c'])}, {round(cmyk['m'])}, {round(cmyk['y'])}, {round(cmyk['k'])} (Шаг: {deviation})")

    # 7. Комментарий с увеличенными отступами
    if comment_lines:
        current_y -= 45  # Увеличенный отступ перед комментарием (1.5x)
        c.setFont("Roboto", 12)
        
        # Первая строка с префиксом
        c.drawCentredString(418, current_y, comment_lines[0])
        current_y -= 15
        
        # Остальные строки
        for line in comment_lines[1:]:
            c.drawCentredString(418, current_y, line)
            current_y -= 15
        
        current_y -= 45  # Увеличенный отступ после комментария (1.5x)
    else:
        current_y -= 90  # Больший отступ если нет комментария

    # 8. Цветовая сетка
    total_grid_width = 3 * (3 * cell_size + 2 * gap_x) + 2 * group_gap_x
    start_x = (836 - total_grid_width) / 2

    for group_row in range(3):
        for group_col in range(3):
            group = cmyk_variants(cmyk, deviation)[group_row * 3 + group_col]
            group_x = start_x + group_col * (3 * cell_size + 2 * gap_x + group_gap_x)
            group_y = current_y - group_row * (3 * cell_size + 2 * gap_y + group_gap_y)
            
            for row in range(3):
                for col in range(3):
                    variant = group[row * 3 + col]
                    x = group_x + col * (cell_size + gap_x)
                    y = group_y - row * (cell_size + gap_y)
                    
                    c.setFillColorCMYK(
                        variant['c']/100,
                        variant['m']/100,
                        variant['y']/100,
                        variant['k']/100
                    )
                    c.rect(x, y, cell_size, cell_size, fill=1, stroke=0)
                    
                    c.setFillColorCMYK(0, 0, 0, 1)
                    c.setFont("Roboto", 8)
                    c.drawCentredString(x + cell_size/2, y - 10, f"C:{round(variant['c'])} M:{round(variant['m'])}")
                    c.drawCentredString(x + cell_size/2, y - 20, f"Y:{round(variant['y'])} K:{round(variant['k'])}")

    c.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name='cmyk_variants.pdf', mimetype='application/pdf')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5030)