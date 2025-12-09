package com.cloudfly.pos.utils;

import com.cloudfly.pos.models.User;
import java.util.prefs.Preferences;

public class SessionManager {

    private static SessionManager instance;
    private static final Preferences prefs = Preferences.userNodeForPackage(SessionManager.class);

    private User currentUser;
    private String token;
    private long loginTime;

    private SessionManager() {
    }

    public static SessionManager getInstance() {
        if (instance == null) {
            instance = new SessionManager();
        }
        return instance;
    }

    public void login(User user, String token) {
        this.currentUser = user;
        this.token = token;
        this.loginTime = System.currentTimeMillis();

        // Guardar token en preferencias (para auto-login)
        prefs.put("token", token);
        prefs.put("username", user.getUsername());
    }

    public void logout() {
        this.currentUser = null;
        this.token = null;
        this.loginTime = 0;

        // Limpiar preferencias
        prefs.remove("token");
        prefs.remove("username");
    }

    public boolean isLoggedIn() {
        return currentUser != null && token != null;
    }

    public User getCurrentUser() {
        return currentUser;
    }

    public String getToken() {
        return token;
    }

    public String getSavedToken() {
        return prefs.get("token", null);
    }

    public String getSavedUsername() {
        return prefs.get("username", null);
    }

    public boolean hasSavedSession() {
        return getSavedToken() != null;
    }
}
