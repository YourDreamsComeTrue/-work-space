document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id') || '00000001';

    const scriptPath = `stories/story-${storyId}.js`;
    const script = document.createElement('script');
    script.src = scriptPath;

    script.onload = function() {
        if (typeof storyData !== 'undefined') {
            document.getElementById('story-title').innerText = storyData.title;
            
            const contentContainer = document.getElementById('story-content');
            contentContainer.innerHTML = "";

            let allParagraphs = [];
            if (Array.isArray(storyData.pages)) {
                allParagraphs = storyData.pages;
            } else if (storyData.content) {
                allParagraphs = [storyData.content];
            }

            // دمج النص ككتلة واحدة متصلة مع دعم الأسطر والفقرات
            allParagraphs.forEach(text => {
                let p = document.createElement('p');
                p.innerHTML = text.replace(/\n/g, '<br>');
                contentContainer.appendChild(p);
            });

        } else {
            showError("ملف القصة فارغ أو غير متوافق.");
        }
    };

    script.onerror = function() {
        showError(`عذراً، لم يتم العثور على القصة رقم (${storyId})`);
    };

    document.head.appendChild(script);

    function showError(msg) {
        document.getElementById('story-title').innerText = "تنبيه";
        document.getElementById('story-content').innerHTML = `<p style="color: #990000; text-align: center;">${msg}</p>`;
    }
});
