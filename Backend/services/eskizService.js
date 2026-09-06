const axios = require("axios");

class EskizService {
  constructor() {
    this.baseURL = "https://notify.eskiz.uz/api";
    this.token = null;
    this.tokenExpiresAt = null;
  }

  resetTokenCache() {
    this.token = null;
    this.tokenExpiresAt = null;
  }

  getCredentials() {
    try {
      const { getCachedSettingsSync } = require("./settingsService");
      const settings = getCachedSettingsSync();
      const email = (settings?.eskizEmail || process.env.ESKIZ_EMAIL || "").trim();
      const password = (settings?.eskizPassword || process.env.ESKIZ_PASSWORD || "").trim();
      const from = (settings?.eskizFrom || "4546").trim();
      return { email, password, from };
    } catch {
      return {
        email: (process.env.ESKIZ_EMAIL || "").trim(),
        password: (process.env.ESKIZ_PASSWORD || "").trim(),
        from: "4546",
      };
    }
  }

  isConfigured() {
    const { email, password } = this.getCredentials();
    if (!email || !password) return false;
    if (email.includes("example.com") || email === "your_eskiz_email@example.com") return false;
    return true;
  }

  async getToken(forceRefresh = false) {
    if (!forceRefresh && this.token && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.token;
    }

    if (!this.isConfigured()) {
      throw new Error("Eskiz SMS xizmati sozlanmagan (ESKIZ_EMAIL / ESKIZ_PASSWORD kiritilmagan)");
    }

    const { email, password } = this.getCredentials();

    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password,
      });

      if (!response.data?.data?.token) {
        throw new Error("Eskiz token topilmadi");
      }

      this.token = response.data.data.token;
      this.tokenExpiresAt = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
      return this.token;
    } catch (err) {
      this.token = null;
      this.tokenExpiresAt = null;
      const msg = err.response?.data?.message || err.response?.statusText || err.message;
      throw new Error(`Eskiz avtorizatsiya xatosi (${err.response?.status || 500}): ${msg}`);
    }
  }

  formatPhone(phone) {
    const onlyDigits = String(phone || "").replace(/\D/g, "");
    if (!onlyDigits) {
      throw new Error("Telefon raqami kiritilmagan");
    }

    return onlyDigits.startsWith("998") ? onlyDigits : `998${onlyDigits}`;
  }

  async sendSMS(phone, message) {
    try {
      if (!this.isConfigured()) {
        console.warn("[Eskiz SMS] Eskiz sozlamalari to'ldirilmagan. SMS yuborilmadi.");
        return {
          success: false,
          error: "Eskiz SMS ma'lumotlari kiritilmagan (Sozlamalar yoki .env)",
        };
      }

      let token;
      try {
        token = await this.getToken();
      } catch (tokenErr) {
        console.warn("[Eskiz SMS] Token olishda xatolik:", tokenErr.message);
        return {
          success: false,
          error: tokenErr.message,
        };
      }

      const formattedPhone = this.formatPhone(phone);
      const { from } = this.getCredentials();

      try {
        const response = await axios.post(
          `${this.baseURL}/message/sms/send`,
          {
            mobile_phone: formattedPhone,
            message,
            from: from || "4546",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return {
          success: true,
          status: response.data?.status || "sent",
          messageId: response.data?.id || null,
          raw: response.data,
        };
      } catch (sendErr) {
        // If 401 unauthorized, try clearing token and retry once
        if (sendErr.response?.status === 401) {
          try {
            token = await this.getToken(true);
            const retryRes = await axios.post(
              `${this.baseURL}/message/sms/send`,
              {
                mobile_phone: formattedPhone,
                message,
                from: from || "4546",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            return {
              success: true,
              status: retryRes.data?.status || "sent",
              messageId: retryRes.data?.id || null,
              raw: retryRes.data,
            };
          } catch (retryErr) {
            console.warn("[Eskiz SMS] Qayta yuborishda xatolik:", retryErr.message);
            return {
              success: false,
              error: retryErr.response?.data?.message || retryErr.message,
            };
          }
        }

        console.warn("[Eskiz SMS] SMS yuborishda xatolik:", sendErr.message);
        return {
          success: false,
          error: sendErr.response?.data?.message || sendErr.message,
        };
      }
    } catch (err) {
      console.warn("[Eskiz SMS] Kutilmagan xatolik:", err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

module.exports = new EskizService();
