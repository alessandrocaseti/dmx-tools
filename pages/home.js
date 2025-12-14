function scrollToCards() { window.scrollTo({ top: 2000, behavior: 'smooth' }); }

function scrollToFeatures() 
{
    const featuresSection = document.getElementById('featuresSection');
    if (featuresSection) { featuresSection.scrollIntoView({ behavior: 'smooth' }); }
}

// Animazione zoom su scroll per homeHeroBg
window.addEventListener('scroll', function () 
{
    const img = document.getElementById('homeHeroBg');
    if (!img) return;
    const scrollY = window.scrollY || window.pageYOffset;
    let scale = 1 + Math.min(scrollY / 400, 1) * 0.15;
    img.style.transform = `scale(${scale})`;
    img.style.opacity = 0.9;

    // Fade-in animazione per testi
    const heroTitle = document.getElementById('heroTitle');
    const featureCards = document.querySelectorAll('#featureCards .fade-in');
    // Mostra il titolo appena la pagina viene caricata
    if (heroTitle && !heroTitle.classList.contains('visible')) { heroTitle.classList.add('visible'); }

    // Mostra le card quando sono visibili nello scroll, con delay sequenziale
    featureCards.forEach(function (card, i) 
    {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight - 60) 
        {
            card.style.transitionDelay = (i * 0.15) + 's';
            card.style.opacity = '1';
            card.classList.add('visible');
        }
        else 
        {
            card.style.opacity = '0';
            card.classList.remove('visible');
        }
    });
});

// Mostra il titolo subito all'avvio
window.addEventListener('DOMContentLoaded', function () 
{
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) heroTitle.classList.add('visible');
    const featureCards = document.querySelectorAll('#featureCards .fade-in'); // Applica il delay alle card all'avvio
    featureCards.forEach(function (card, i) { card.style.transitionDelay = (i * 0.15) + 's'; });
});