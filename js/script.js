// MARAMCAR - Script principal

document.addEventListener('DOMContentLoaded', function() {
    const { jsPDF } = window.jspdf;

    // ===== HORLOGE =====
    function updateClock() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        };
        const dateStr = now.toLocaleDateString('fr-FR', options);
        document.getElementById('liveClock').innerHTML = `<i class="far fa-calendar-alt"></i> ${dateStr}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ===== MÉTÉO =====
    const weatherSpan = document.querySelector('#weatherWidget span');
    const weatherIcon = document.querySelector('#weatherWidget i');
    
    function getWeatherIcon(code) {
        if (code >= 0 && code <= 1) return 'fa-sun';
        if (code == 2) return 'fa-cloud-sun';
        if (code == 3) return 'fa-cloud';
        if (code >= 45 && code <= 48) return 'fa-smog';
        if (code >= 51 && code <= 67) return 'fa-cloud-rain';
        if (code >= 71 && code <= 77) return 'fa-snowflake';
        if (code >= 80 && code <= 99) return 'fa-cloud-showers-heavy';
        return 'fa-cloud-sun';
    }

    fetch('https://api.open-meteo.com/v1/forecast?latitude=36.75&longitude=3.05&current_weather=true&timezone=auto')
        .then(response => response.json())
        .then(data => {
            const temp = data.current_weather.temperature;
            const code = data.current_weather.weathercode;
            weatherIcon.className = `fas ${getWeatherIcon(code)}`;
            weatherSpan.textContent = `${temp}°C · Alger`;
        })
        .catch(() => {
            weatherSpan.textContent = 'Météo indisponible';
        });

    // ===== LANGUAGE SWITCHER =====
    const langToggle = document.getElementById('langToggle');
    const body = document.body;
    let currentLang = localStorage.getItem('maramcar_lang') || 'fr';
    if (currentLang === 'fr') {
        body.classList.add('lang-fr-only');
    } else {
        body.classList.add('lang-ar-only');
    }
    langToggle.addEventListener('click', () => {
        if (body.classList.contains('lang-fr-only')) {
            body.classList.remove('lang-fr-only');
            body.classList.add('lang-ar-only');
            localStorage.setItem('maramcar_lang', 'ar');
        } else {
            body.classList.remove('lang-ar-only');
            body.classList.add('lang-fr-only');
            localStorage.setItem('maramcar_lang', 'fr');
        }
    });

    // ===== TERMS TOGGLE =====
    const termsToggle = document.getElementById('termsToggle');
    const termsContent = document.getElementById('termsContent');
    termsToggle.addEventListener('click', () => {
        termsContent.classList.toggle('show');
        termsToggle.classList.toggle('rotated');
    });

    // ===== MODAL =====
    const modal = document.getElementById('bookingModal');
    const closeModal = document.querySelector('.close-modal');
    const waButtons = document.querySelectorAll('.btn-wa');
    const modalCarName = document.getElementById('modalCarName');
    const modalCarNameAr = document.getElementById('modalCarNameAr');
    const carInput = document.getElementById('carInput');
    const carArInput = document.getElementById('carArInput');
    const bookingForm = document.getElementById('bookingForm');
    const acceptTerms = document.getElementById('acceptTerms');

    waButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const car = btn.getAttribute('data-car');
            const card = btn.closest('.car-card');
            const carAr = card.querySelector('.car-name .ar')?.innerText || '';
            modalCarName.textContent = car;
            modalCarNameAr.textContent = carAr;
            carInput.value = car;
            carArInput.value = carAr;
            bookingForm.reset();
            document.getElementById('duration').value = 2;
            modal.style.display = 'block';
        });
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // ===== GÉNÉRATION PDF =====
    function generatePDF(data) {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(194, 43, 43);
        doc.text('MARAMCAR', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Facture N°: INV-${Date.now().toString().slice(-8)}`, 20, 30);
        doc.text(`Client: ${data.prenom} ${data.nom}`, 20, 40);
        doc.text(`Téléphone: ${data.phone}`, 20, 50);
        doc.text(`Voiture: ${data.car} / ${data.carAr}`, 20, 60);
        doc.text(`Durée: ${data.duree} jours`, 20, 70);
        doc.text(`Livraison: ${data.delivery}`, 20, 80);
        doc.text('Pour les prix, contactez-nous / للأسعار اتصل بنا', 20, 90);
        doc.text('Conditions acceptées:', 20, 105);
        doc.setFontSize(9);
        let y = 115;
        const conditions = [
            '1. Âge minimum 25 ans / السن القانوني 25 سنة',
            '2. Responsabilité unique du signataire / مسؤولية الشخص الواحد',
            '3. Interdiction transport illégal / منع نقل بضائع غير شرعية',
            '4. Interdiction remorque / منع ربط مقطورة',
            '5. Autorisation pour quitter wilaya / استئذان لمغادرة الولاية',
            '6. 300 km/jour max, dépassement 15 DA/km / 300 كم/يوم',
            '7. Amendes à la charge du client / المخالفات على الزبون',
            '8. Assurance nationale uniquement / تأمين وطني فقط',
            '9. Perte papiers: client responsable / ضياع أوراق',
            '10. Durée calculée dès signature / المدة من التوقيع',
            '11. Interdiction circuits/courses / منع السباقات',
            '12. Retour à l\'agence obligatoire / إرجاع للوكالة',
            '13. Perte accessoires: frais client / ضياع كسورات',
            '14. Accident: réparation + immobilisation client / حادث: إصلاح وتوقف',
            '15. Société non responsable dommages corporels / لا مسؤولية عن أضرار بدنية',
            '16. Pneus crevés: réparation client / إطارات: الزبون يتحمل'
        ];
        conditions.forEach(cond => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(cond, 20, y);
            y += 7;
        });
        doc.save(`MARAMCAR_${data.prenom}_${data.nom}.pdf`);
    }

    // ===== ENVOI =====
    const canadianNumber = '14389206259';
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!acceptTerms.checked) {
            alert('Veuillez accepter les conditions');
            return;
        }
        const prenom = document.getElementById('firstName').value.trim();
        const nom = document.getElementById('lastName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const duree = document.getElementById('duration').value;
        let delivery = '';
        document.querySelectorAll('input[name="delivery"]').forEach(r => {
            if (r.checked) delivery = r.value === 'aeroport' ? 'Aéroport' : 'Bureau';
        });
        if (!prenom || !nom || !phone || !duree || !delivery) {
            alert('Remplissez tous les champs');
            return;
        }

        // Générer PDF
        const data = {
            prenom, nom, phone, duree, delivery,
            car: carInput.value,
            carAr: carArInput.value
        };
        generatePDF(data);

        // Ouvrir WhatsApp avec message
        const msg = `*MARAMCAR - Demande de réservation*%0A` +
                    `Client: ${prenom} ${nom}%0A` +
                    `Téléphone: ${phone}%0A` +
                    `Voiture: ${carInput.value} / ${carArInput.value}%0A` +
                    `Durée: ${duree} jours%0A` +
                    `Livraison: ${delivery}%0A` +
                    `*Veuillez trouver le PDF ci-joint (téléchargé automatiquement)*`;
        window.open(`https://wa.me/${canadianNumber}?text=${msg}`, '_blank');

        modal.style.display = 'none';
        bookingForm.reset();
    });

    // ===== BACK TO TOP =====
    const backBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backBtn.classList.add('visible');
        else backBtn.classList.remove('visible');
    });
    backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
