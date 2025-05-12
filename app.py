from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image
import os
from io import BytesIO
import uuid

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件大小为16MB
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# 确保上传文件夹存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_file_size(file):
    """获取文件大小并转换为合适的单位"""
    size_bytes = os.path.getsize(file) if isinstance(file, str) else len(file.read())
    for unit in ['B', 'KB', 'MB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} GB"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compress', methods=['POST'])
def compress_image():
    if 'image' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['image']
    quality = int(request.form.get('quality', 85))
    
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        return jsonify({'error': '不支持的文件格式'}), 400

    # 保存原始图片
    original_filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
    original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
    file.save(original_path)
    original_size = get_file_size(original_path)

    # 压缩图片
    img = Image.open(original_path)
    compressed_filename = 'compressed_' + original_filename
    compressed_path = os.path.join(app.config['UPLOAD_FOLDER'], compressed_filename)
    
    # 保持RGBA模式（如果是PNG）
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img.save(compressed_path, 'PNG', optimize=True, quality=quality)
    else:
        img.convert('RGB').save(compressed_path, 'JPEG', optimize=True, quality=quality)
    
    compressed_size = get_file_size(compressed_path)

    return jsonify({
        'original_url': f'/static/uploads/{original_filename}',
        'compressed_url': f'/static/uploads/{compressed_filename}',
        'original_size': original_size,
        'compressed_size': compressed_size
    })

if __name__ == '__main__':
    app.run(debug=True) 