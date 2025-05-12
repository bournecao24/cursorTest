document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const compressBtn = document.getElementById('compressBtn');
    const previewContainer = document.querySelector('.preview-container');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const downloadBtn = document.getElementById('downloadBtn');

    let selectedFile = null;

    // 拖放功能
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ddd';
        const files = e.dataTransfer.files;
        handleFile(files[0]);
    });

    // 点击上传
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // 质量滑块
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    function handleFile(file) {
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('请上传图片文件！');
            return;
        }

        selectedFile = file;
        compressBtn.disabled = false;

        // 预览原始图片
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            previewContainer.style.display = 'grid';
            originalSize.textContent = formatFileSize(file.size);
        };
        reader.readAsDataURL(file);
    }

    // 压缩按钮点击事件
    compressBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('quality', qualitySlider.value);

        try {
            compressBtn.disabled = true;
            compressBtn.textContent = '压缩中...';

            const response = await fetch('/compress', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                compressedPreview.src = data.compressed_url;
                originalSize.textContent = data.original_size;
                compressedSize.textContent = data.compressed_size;
                downloadBtn.href = data.compressed_url;
                previewContainer.style.display = 'grid';
            } else {
                alert(data.error || '压缩失败');
            }
        } catch (error) {
            alert('发生错误：' + error.message);
        } finally {
            compressBtn.disabled = false;
            compressBtn.textContent = '压缩图片';
        }
    });

    function formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}); 