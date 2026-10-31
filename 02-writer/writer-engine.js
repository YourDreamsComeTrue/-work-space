document.addEventListener("DOMContentLoaded", () => {
    // استخراج معرف القصة من الرابط (الافتراضي 00000001)
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id') || '00000001';

    // مسار ملف القصة الديناميكي
    const scriptPath = `stories/story-${storyId}.js`;

    const script = document.createElement('script');
    script.src = scriptPath;

    script.onload = function() {
        if (typeof storyData !== 'undefined') {
            document.getElementById('story-title').innerText = storyData.title;
            
            const contentContainer = document.getElementById('story-content');
            contentContainer.innerHTML = "";

            // توزيع النص داخل فقرات ليتناسب مع شكل الكتاب
            if (Array.isArray(storyData.pages)) {
                storyData.pages.forEach(pageText => {
                    let p = document.createElement('p');
                    p.innerHTML = pageText.replace(/\n/g, '<br>');
                    contentContainer.appendChild(p);
                });
            } else if (storyData.content) {
                let p = document.createElement('p');
                p.innerHTML = storyData.content.replace(/\n/g, '<br>');
                contentContainer.appendChild(p);
            }
        } else {
            showError("ملف القصة فارغ أو غير متوافق.");
        }
    };

    script.onerror = function() {
        showError(`عذراً، لم يتم العثور على القصة رقم (${storyId}) في مجلد stories.`);
    };

    document.head.appendChild(script);

    function showError(msg) {
        document.getElementById('story-title').innerText = "تنبيه";
        document.getElementById('story-content').innerHTML = `<p style="color: #990000; text-align: center;">${msg}</p>`;
    }
});

