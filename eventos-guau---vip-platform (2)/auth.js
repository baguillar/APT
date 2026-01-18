
const Auth = {
    check: async () => {
        try {
            const res = await fetch('api/auth.php?action=check');
            return await res.json();
        } catch (e) {
            return { logged: false };
        }
    },

    login: async (email, password) => {
        const res = await fetch('api/auth.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error };
    },

    register: async (formData) => {
        const data = Object.fromEntries(formData.entries());
        const res = await fetch('api/auth.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await res.json();
        if (res.ok) {
            return { success: true };
        }
        return { success: false, error: resData.error };
    },

    logout: async () => {
        await fetch('api/auth.php?action=logout');
        return true;
    }
};
