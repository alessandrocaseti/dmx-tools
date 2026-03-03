function isDesktop()
{
    try {
        if (typeof process !== 'undefined' && process.versions && process.versions.electron) return true;
        if (typeof navigator === 'object' && navigator.userAgent && navigator.userAgent.indexOf('Electron') !== -1) return true;
    } catch (e) {}
    return false;
}

function applyDesktopOnly()
{
    try 
    {
        var desktop = isDesktop();
        if (typeof document === 'undefined' || !document.querySelectorAll) return;
        var els = document.querySelectorAll('.desktop-only');
        var hds = document.querySelectorAll('.desktop-hidden');
        for (var i = 0; i < els.length; i++) 
        {
            var el = els[i];
            if (desktop) { el.style.display = ''; } 
            else { el.style.display = 'none'; }
        }
        for (var i = 0; i < hds.length; i++) 
        {
            var el = hds[i];
            if (desktop) { el.style.display = 'none'; } 
            else { el.style.display = ''; }
        }
    } catch (e) { }
}

if (typeof document !== 'undefined') 
{
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', applyDesktopOnly); } 
    else { applyDesktopOnly(); }
}