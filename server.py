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
    comment = data.get('comment', '')
    pantone = data.get('pantone', '')

    variants = cmyk_variants(cmyk, deviation)

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(836, 1097))  # 11.61 × 15.24 inch
    cell = 44
    gap_x = 12
    gap_y = 24  
    group_gap_x = 40
    group_gap_y = 64  #


    title_height = 30
    cmyk_height = 24 if pantone else 0
    comment_height = 24 if comment else 0
    header_block = title_height + cmyk_height + comment_height + 40
    total_grid_height = 3 * (3 * cell + 2 * gap_y) + 2 * group_gap_y
    block_height = header_block + total_grid_height
    top_y = (1097 + block_height) // 2

    y = top_y
    c.setFont("Roboto", 22)
    if pantone:
        # Добавляем диапазон в заголовок
        c.drawCentredString(418, y, f"{pantone} (Шаг: {deviation})")
        y -= title_height
        c.setFont("Roboto", 15)
        c.drawCentredString(418, y, f"C:{round(cmyk['c'])}   M:{round(cmyk['m'])}   Y:{round(cmyk['y'])}   K:{round(cmyk['k'])}")
        y -= cmyk_height
    else:
        c.drawCentredString(418, y, f"CMYK {round(cmyk['c'])},{round(cmyk['m'])},{round(cmyk['y'])},{round(cmyk['k'])} (Шаг: {deviation})")
        y -= title_height

    if comment:
        c.setFont("Roboto", 12)
        c.drawCentredString(418, y, "Комментарий: " + comment)
        y -= comment_height

        y -= 40

    total_grid_width = 3 * (3 * cell + 2 * gap_x) + 2 * group_gap_x
    start_x = (836 - total_grid_width) // 2
    start_y = y

    for group_row in range(3):
        for group_col in range(3):
            group_idx = group_row * 3 + group_col
            group = variants[group_idx]
            gx = start_x + group_col * (3 * cell + 2 * gap_x + group_gap_x)
            gy = start_y - group_row * (3 * cell + 2 * gap_y + group_gap_y)
            for i in range(3):
                for j in range(3):
                    idx = i * 3 + j
                    v = group[idx]
                    cx = gx + j * (cell + gap_x)
                    cy = gy - i * (cell + gap_y)
                    c.setFillColorCMYK(v['c']/100, v['m']/100, v['y']/100, v['k']/100)
                    c.rect(cx, cy, cell, cell, fill=1, stroke=0)
                    c.setFillColorCMYK(0, 0, 0, 1)
                    c.setFont("Roboto", 8)
                    # line1 = f"C:{'+' if v['dc']>0 else ''}{v['dc']}   M:{'+' if v['dm']>0 else ''}{v['dm']}"
                    # line2 = f"Y:{'+' if v['dy']>0 else ''}{v['dy']}   K:{'+' if v['dk']>0 else ''}{v['dk']}"
                    line1 = f"C:{round(v['c'])}   M:{round(v['m'])}"
                    line2 = f"Y:{round(v['y'])}   K:{round(v['k'])}"
                    c.drawCentredString(cx + cell/2, cy - 10, line1)
                    c.drawCentredString(cx + cell/2, cy - 20, line2)
    c.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name='cmyk_variants.pdf', mimetype='application/pdf')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5030)
