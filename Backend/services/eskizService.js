const axios = require("axios");

class EskizService {
  constructor() {
    this.email = process.env.ESKIZ_EMAIL;
    this.password = process.env.ESKIZ_PASSWORD;
    this.baseURL = "https://notify.eskiz.uz/api";
    this.token = null;
    this.tokenExpiresAt = null;
  }

  async getToken() {
    if (this.token && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.token;
    }

    if (!this.email || !this.password) {
      throw new Error("ESKIZ credentials are missing");
    }

    const response = await axios.post(`${this.baseURL}/auth/login`, {
      email: this.email,
      password: this.password,
    });

    if (!response.data?.data?.token) {
      throw new Error("Eskiz token not found");
    }

    this.token = response.data.data.token;
    this.tokenExpiresAt = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
    return this.token;
  }

  formatPhone(phone) {
    const onlyDigits = String(phone || "").replace(/\D/g, "");
    if (!onlyDigits) {
      throw new Error("Phone number is required");
    }

    return onlyDigits.startsWith("998") ? onlyDigits : `998${onlyDigits}`;
  }

  async sendSMS(phone, message) {
    const token = await this.getToken();
    const formattedPhone = this.formatPhone(phone);

    const response = await axios.post(
      `${this.baseURL}/message/sms/send`,
      {
        mobile_phone: formattedPhone,
        message,
        from: "4546",
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
  }
}

module.exports = new EskizService();
