// Image Processing
const imageInput = document.getElementById('imageInput');
const imageCanvas = document.getElementById('imageCanvas');
const imageWidth = document.getElementById('imageWidth');
const imageHeight = document.getElementById('imageHeight');
const imageBlur = document.getElementById('imageBlur');
const imageRotate = document.getElementById('imageRotate');
const imageWidthValue = document.getElementById('imageWidthValue');
const imageHeightValue = document.getElementById('imageHeightValue');
const imageBlurValue = document.getElementById('imageBlurValue');
const imageRotateValue = document.getElementById('imageRotateValue');
const downloadImage = document.getElementById('downloadImage');

imageInput.addEventListener('change', loadImage);
imageWidth.addEventListener('input', processImage);
imageHeight.addEventListener('input', processImage);
imageBlur.addEventListener('input', processImage);
imageRotate.addEventListener('input', processImage);
imageWidthValue.addEventListener('input', updateImageWidth);
imageHeightValue.addEventListener('input', updateImageHeight);
imageBlurValue.addEventListener('input', updateImageBlur);
imageRotateValue.addEventListener('input', updateImageRotate);
downloadImage.addEventListener('click', downloadProcessedImage);

let imageObj = null;

function loadImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        imageObj = new Image();
        imageObj.src = reader.result;
        imageObj.onload = () => {
            processImage();
            imageWidthValue.value = imageWidth.value;
            imageHeightValue.value = imageHeight.value;
            imageBlurValue.value = imageBlur.value;
            imageRotateValue.value = imageRotate.value;
        };
    };

    reader.readAsDataURL(file);
}

function processImage() {
    const ctx = imageCanvas.getContext('2d');
    const width = imageWidth.value;
    const height = imageHeight.value;
    const blur = imageBlur.value;
    const rotate = imageRotate.value;

    // Set canvas size to match the processed image dimensions
    imageCanvas.width = width;
    imageCanvas.height = height;

    // Save the current transformation matrix
    ctx.save();

    // Translate the canvas origin to the center
    ctx.translate(width / 2, height / 2);

    // Rotate the canvas
    ctx.rotate(rotate * Math.PI / 180);

    // Apply blur filter
    ctx.filter = `blur(${blur}px)`;

    // Draw the image
    ctx.drawImage(imageObj, -width / 2, -height / 2, width, height);

    // Restore the transformation matrix
    ctx.restore();

    // Update value displays
    imageWidthValue.value = width;
    imageHeightValue.value = height;
    imageBlurValue.value = blur;
    imageRotateValue.value = rotate;
}

function updateImageWidth() {
    imageWidth.value = this.value;
    processImage();
}

function updateImageHeight() {
    imageHeight.value = this.value;
    processImage();
}

function updateImageBlur() {
    imageBlur.value = this.value;
    processImage();
}

function updateImageRotate() {
    imageRotate.value = this.value;
    processImage();
}

function downloadProcessedImage() {
    // Buat sebuah link untuk mengunduh
    const link = document.createElement('a');

    // Atur nama file yang diunduh
    link.download = 'processed-image.png';

    // Dapatkan data gambar dari canvas (tanpa latar belakang)
    link.href = imageCanvas.toDataURL('image/png', 1);

    // Klik link untuk mengunduh
    link.click();
}

//audio processing
document.addEventListener('DOMContentLoaded', function() {
    const audioInput = document.getElementById('audioInput');
    const audioPlayer = document.getElementById('audioPlayer');
    const compressButton = document.getElementById('compressAudio');
    const downloadButton = document.getElementById('audioDownload'); // Ganti downloadLink menjadi downloadButton

    // Event listener untuk input file audio
    audioInput.addEventListener('change', function() {
        const file = this.files[0];
        const objectURL = URL.createObjectURL(file);
        audioPlayer.src = objectURL;
    });

    // Event listener untuk tombol kompres audio
    compressButton.addEventListener('click', async function() {
        const file = audioInput.files[0];
        if (!file) {
            alert('Please select an audio file first.');
            return;
        }

        try {
            // Kompressi audio
            const compressedAudioBlob = await compressAudio(file);

            // Tampilkan pemberitahuan
            alert('Audio compressed successfully. The download will start shortly.');

            // Aktifkan tombol download audio
            downloadButton.href = URL.createObjectURL(compressedAudioBlob);
            downloadButton.download = 'compressed_audio.mp3';
            downloadButton.removeAttribute('disabled');
        } catch (error) {
            console.error('Error compressing audio:', error);
            alert('An error occurred while compressing the audio.');
        }
    });

    // Fungsi untuk mengompresi audio
    function compressAudio(inputFile) {
        return new Promise((resolve, reject) => {
            const audioContext = new AudioContext();
            const fileReader = new FileReader();

            fileReader.onload = function(event) {
                const arrayBuffer = event.target.result;
                audioContext.decodeAudioData(arrayBuffer, function(decodedData) {
                    const channels = decodedData.numberOfChannels;
                    const sampleRate = decodedData.sampleRate;

                    const buffer = audioContext.createBuffer(channels, decodedData.length, sampleRate);
                    buffer.getChannelData(0).set(decodedData.getChannelData(0));

                    const audioBufferSourceNode = audioContext.createBufferSource();
                    audioBufferSourceNode.buffer = buffer;
                    audioBufferSourceNode.connect(audioContext.destination);

                    const destinationSampleRate = 16000; // Target sample rate
                    const sampleRateRatio = sampleRate / destinationSampleRate;
                    const duration = buffer.duration / sampleRateRatio;

                    const offlineAudioContext = new OfflineAudioContext(channels, destinationSampleRate * duration, destinationSampleRate);
                    const offlineAudioBufferSourceNode = offlineAudioContext.createBufferSource();
                    offlineAudioBufferSourceNode.buffer = buffer;
                    offlineAudioBufferSourceNode.connect(offlineAudioContext.destination);

                    offlineAudioBufferSourceNode.start();

                    offlineAudioContext.startRendering().then(function(renderedBuffer) {
                        const audioBlob = audioBufferToBlob(renderedBuffer, destinationSampleRate);
                        resolve(audioBlob);
                    }).catch(function(error) {
                        reject(error);
                    });
                });
            };

            fileReader.onerror = function(error) {
                reject(error);
            };

            fileReader.readAsArrayBuffer(inputFile);
        });
    }

    // Fungsi untuk mengonversi audio buffer menjadi blob
    function audioBufferToBlob(audioBuffer, sampleRate) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const interleavedLength = audioBuffer.length * numberOfChannels;
        const interleavedData = new Float32Array(interleavedLength);

        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < audioBuffer.length; i++) {
                interleavedData[i * numberOfChannels + channel] = channelData[i];
            }
        }

        const wavAudioBlob = encodeWAV(interleavedData, numberOfChannels, sampleRate);
        return new Blob([wavAudioBlob], { type: 'audio/wav' });
    }

    // Fungsi untuk mengonversi audio buffer menjadi format WAV
    function encodeWAV(samples, channels, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        const writeString = function(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        const floatTo16BitPCM = function(output, offset, input) {
            for (let i = 0; i < input.length; i++, offset += 2) {
                const s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        };

        writeString(view, 0, 'RIFF'); // RIFF identifier
        view.setUint32(4, 36 + samples.length * 2, true); // RIFF chunk length
        writeString(view, 8, 'WAVE'); // RIFF type
        writeString(view, 12, 'fmt '); // format chunk identifier
        view.setUint32(16, 16, true); // format chunk length
        view.setUint16(20, 1, true); // sample format (raw)
        view.setUint16(22, channels, true); // channel count
        view.setUint32(24, sampleRate, true); // sample rate
        view.setUint32(28, sampleRate * 2 * channels, true); // byte rate (sample rate * block align)
        view.setUint16(32, 2 * channels, true); // block align (channel count * bytes per sample)
        view.setUint16(34, 16, true); // bits per sample
        writeString(view, 36, 'data'); // data chunk identifier
        view.setUint32(40, samples.length * 2, true); // data chunk length
        floatTo16BitPCM(view, 44, samples); // write the PCM samples

        return view;
    }
});
