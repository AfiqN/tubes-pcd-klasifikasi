

document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const fileName = document.getElementById('fileName');
    const imagePreview = document.getElementById('imagePreview');
    const resetButton = document.getElementById('resetButton');
    const dropZone = document.querySelector('.custom-file-label');
    const form = document.getElementById('imageForm');
    const resultDiv = document.getElementById('result');

    // Fungsi untuk menangani file yang dipilih
    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            // Menampilkan nama file
            fileName.textContent = file.name;

            // Menampilkan preview gambar
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                form.classList.add('preview-active');
            };
            reader.readAsDataURL(file);
            
            // Menyimpan file ke input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
        }
    }

    // Event listener untuk drag & drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // Event listener untuk file input biasa
    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        handleFile(file);
    });

    // Fungsi reset yang diperbarui
    resetButton.addEventListener('click', async function(event) {
    event.preventDefault();

    try {
        // Panggil endpoint untuk menghapus session
        const response = await fetch('/clear-session', {
            method: 'POST',
        });

        if (response.ok) {
            // Reload halaman setelah session dihapus
            window.location.reload();
        } else {
            console.error('Gagal menghapus session di server.');
        }
    } catch (error) {
        console.error('Error saat menghapus session:', error);
    }
});
});