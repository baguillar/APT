
const UX = {
    toast: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    skeleton: () => `
        <div class="skeleton-container">
            <div class="card skeleton" style="height: 200px"></div>
            <div class="card skeleton" style="height: 400px"></div>
        </div>
    `,

    showLoader: () => document.getElementById('loader-overlay').classList.remove('hidden'),
    hideLoader: () => document.getElementById('loader-overlay').classList.add('hidden')
};
