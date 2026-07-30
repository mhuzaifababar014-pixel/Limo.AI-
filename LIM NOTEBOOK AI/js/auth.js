const Auth = (() => {
    const USERS_KEY = 'limo_users';
    const SESSION_KEY = 'limo_session';
    const SAVED_ACCOUNTS_KEY = 'limo_saved_accounts';

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        } catch { return []; }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY));
        } catch { return null; }
    }

    function saveSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    function getSavedAccounts() {
        try {
            return JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY)) || [];
        } catch { return []; }
    }

    function saveAccount(user) {
        const accounts = getSavedAccounts();
        if (!accounts.find(a => a.email === user.email)) {
            accounts.push({ id: user.id, name: user.name, email: user.email });
            localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
        }
    }

    function removeSavedAccount(email) {
        let accounts = getSavedAccounts();
        accounts = accounts.filter(a => a.email !== email);
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    function signUp(name, email, password) {
        const users = getUsers();
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            throw new Error('Account already exists. Please log in.');
        }
        const user = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
            name: name,
            email: email,
            password: btoa(password),
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        const session = { id: user.id, name: user.name, email: user.email };
        saveSession(session);
        saveAccount(session);
        return session;
    }

    function logIn(email, password) {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) throw new Error('No account found. Please sign up first.');
        if (user.password !== btoa(password)) throw new Error('Wrong password. Try again.');
        const session = { id: user.id, name: user.name, email: user.email };
        saveSession(session);
        saveAccount(session);
        return session;
    }

    function quickLogin(email) {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) throw new Error('Account not found.');
        const session = { id: user.id, name: user.name, email: user.email };
        saveSession(session);
        return session;
    }

    function logOut() {
        clearSession();
    }

    function getUser() {
        return getSession();
    }

    function isLoggedIn() {
        return !!getSession();
    }

    return { signUp, logIn, quickLogin, logOut, getUser, isLoggedIn, getSavedAccounts, removeSavedAccount };
})();
