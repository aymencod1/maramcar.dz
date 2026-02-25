// MARAMCAR - Script principal

document.addEventListener('DOMContentLoaded', function() {

    // ===== GESTION DE L'HORLOGE AVANCÉE =====
    function updateClock() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        };
        const dateStr = now.toLocaleDateString('fr-FR', options);
        document.getElementById('liveClock').innerHTML = `<i class="far fa-calendar-alt"></i> ${dateStr}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ===== MÉTÉO AMÉLIORÉE AVEC ICÔNES DYNAMIQUES =====
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
            const iconClass = getWeatherIcon(code);
            weatherIcon.className = `fas ${iconClass}`;
            weatherSpan.textContent = `${temp}°C · Alger`;
        })
        .catch(() => {
            weatherSpan.textContent = 'Météo indisponible';
        });

    // ===== LANGUAGE SWITCHER =====
    const langToggle = document.getElementById('langToggle');
    const body = document.body;

    // Check for saved language preference
    let currentLang = localStorage.getItem('maramcar_lang') || 'fr'; // default french
    if (currentLang === 'fr') {
        body.classList.add('lang-fr-only');
        body.classList.remove('lang-ar-only');
    } else {
        body.classList.add('lang-ar-only');
        body.classList.remove('lang-fr-only');
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

    // ===== MODAL DE RÉSERVATION =====
    const modal = document.getElementById('bookingModal');
    const closeModal = document.querySelector('.close-modal');
    const waButtons = document.querySelectorAll('.btn-wa');
    const modalCarName = document.getElementById('modalCarName');
    const modalCarNameAr = document.getElementById('modalCarNameAr');
    const carInput = document.getElementById('carInput');
    const carArInput = document.getElementById('carArInput');
    const bookingForm = document.getElementById('bookingForm');
    const acceptTerms = document.getElementById('acceptTerms');

    // Aperçu facture en temps réel
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const duration = document.getElementById('duration');
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    const invoiceName = document.getElementById('invoiceName');
    const invoiceCar = document.getElementById('invoiceCar');
    const invoiceDuration = document.getElementById('invoiceDuration');
    const invoiceDelivery = document.getElementById('invoiceDelivery');

    function updateInvoicePreview() {
        const prenom = firstName.value.trim() || '-';
        const nom = lastName.value.trim() || '-';
        invoiceName.textContent = `${prenom} ${nom}`.trim();
        invoiceCar.textContent = modalCarName.textContent;
        invoiceDuration.textContent = duration.value || '2';
        
        let deliveryText = '-';
        deliveryRadios.forEach(radio => {
            if (radio.checked) {
                deliveryText = radio.value === 'aeroport' ? (document.body.classList.contains('lang-fr-only') ? 'Aéroport' : 'المطار') : (document.body.classList.contains('lang-fr-only') ? 'Bureau' : 'المكتب');
            }
        });
        invoiceDelivery.textContent = deliveryText;
    }

    [firstName, lastName, duration].forEach(input => {
        input.addEventListener('input', updateInvoicePreview);
    });
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', updateInvoicePreview);
    });

    // Ouvrir modal
    waButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const car = this.getAttribute('data-car');
            const card = this.closest('.car-card');
            const carAr = card.querySelector('.car-name .ar') ? card.querySelector('.car-name .ar').innerText : '';
            
            modalCarName.textContent = car;
            modalCarNameAr.textContent = carAr;
            carInput.value = car;
            carArInput.value = carAr;
            
            // Reset form
            bookingForm.reset();
            duration.value = 2;
            updateInvoicePreview();
            
            modal.style.display = 'block';
        });
    });

    // Fermer modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // ===== ENVOI WHATSAPP AVEC FACTURE SANS PRIX =====
    const canadianNumber = '14389206259'; // +1 438 920 6259

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!acceptTerms.checked) {
            alert('Veuillez accepter toutes les conditions de location / الرجاء قبول جميع شروط الكراء');
            return;
        }

        const car = carInput.value;
        const carAr = carArInput.value;
        const prenom = firstName.value.trim();
        const nom = lastName.value.trim();
        const phoneVal = phone.value.trim();
        const duree = duration.value;
        let delivery = '';
        deliveryRadios.forEach(radio => {
            if (radio.checked) delivery = radio.value === 'aeroport' ? 'Aéroport' : 'Bureau';
        });

        if (!prenom || !nom || !phoneVal || !duree || !delivery) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        // Générer numéro de facture unique
        const invoiceNum = 'INV-' + Date.now().toString().slice(-8);

        // Construction du message facture sans prix
        const message = `*MARAMCAR - FACTURE ${invoiceNum}*%0A` +
                        `----------------------%0A` +
                        `*Client:* ${prenom} ${nom}%0A` +
                        `*Téléphone:* ${phoneVal}%0A` +
                        `*Voiture:* ${car} / ${carAr}%0A` +
                        `*Durée:* ${duree} jours%0A` +
                        `*Livraison:* ${delivery}%0A` +
                        `*Pour les prix, contactez-nous* / للأسعار اتصل بنا%0A` +
                        `----------------------%0A` +
                        `*Conditions acceptées (16 articles):*%0A` +
                        `1. Âge minimum 25 ans / السن القانوني 25 سنة%0A` +
                        `2. Responsabilité unique du signataire / مسؤولية الشخص الواحد%0A` +
                        `3. Interdiction transport illégal / منع نقل بضائع غير شرعية%0A` +
                        `4. Interdiction remorque / منع ربط مقطورة%0A` +
                        `5. Autorisation pour quitter wilaya / استئذان لمغادرة الولاية%0A` +
                        `6. 300 km/jour max, dépassement 15 DA/km / 300 كم/يوم%0A` +
                        `7. Amendes à la charge du client / المخالفات على الزبون%0A` +
                        `8. Assurance nationale uniquement / تأمين وطني فقط%0A` +
                        `9. Perte papiers: client responsable / ضياع أوراق%0A` +
                        `10. Durée calculée dès signature / المدة من التوقيع%0A` +
                        `11. Interdiction circuits/courses / منع السباقات%0A` +
                        `12. Retour à l'agence obligatoire / إرجاع للوكالة%0A` +
                        `13. Perte accessoires: frais client / ضياع كسورات%0A` +
                        `14. Accident: réparation + immobilisation client / حادث: إصلاح وتوقف%0A` +
                        `15. Société non responsable dommages corporels / لا مسؤولية عن أضرار بدنية%0A` +
                        `16. Pneus crevés: réparation client / إطارات: الزبون يتحمل%0A` +
                        `----------------------%0A` +
                        `Merci de confirmer cette réservation.`;

        const waUrl = `https://wa.me/${canadianNumber}?text=${message}`;
        window.open(waUrl, '_blank');

        // Fermer modal
        modal.style.display = 'none';
        bookingForm.reset();
    });

    // ===== GESTION DE LA CARTE (lien direct) =====
    const mapModal = document.getElementById('mapModal');
    const closeMap = document.querySelector('.close-map');
    const showMapBtns = document.querySelectorAll('#showMapBtn, #footerShowMapBtn');

    showMapBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            mapModal.style.display = 'block';
        });
    });

    closeMap.addEventListener('click', () => {
        mapModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === mapModal) {
            mapModal.style.display = 'none';
        }
    });

    // ===== BOUTON RETOUR EN HAUT =====
    const backToTopBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== ANIMATIONS DES CARTES =====
    const cards = document.querySelectorAll('.car-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});