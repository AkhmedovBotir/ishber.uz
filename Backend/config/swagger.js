const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ishber Backend API",
      version: "1.0.0",
      description:
        "Admin CRUD, public form, arizalar, suhbatlar. Docs: `/api/docs`. Suhbatlar: `GET|POST /api/interviews`, `PATCH /api/interviews/{id}`.",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      schemas: {
        Admin: {
          type: "object",
          properties: {
            _id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phoneNumber: { type: "string" },
            username: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AdminCreateInput: {
          type: "object",
          required: ["firstName", "lastName", "phoneNumber", "username", "password"],
          properties: {
            firstName: { type: "string", example: "Ali" },
            lastName: { type: "string", example: "Valiyev" },
            phoneNumber: { type: "string", example: "+998901112233" },
            username: { type: "string", example: "ali_admin" },
            password: { type: "string", example: "StrongPass123" },
          },
        },
        AdminUpdateInput: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            phoneNumber: { type: "string" },
            username: { type: "string" },
            password: { type: "string" },
          },
        },
        Vacancy: {
          type: "object",
          properties: {
            _id: { type: "string" },
            applicationFormUrl: {
              type: "string",
              nullable: true,
              example: "https://form.ishber.uz/vacancies/681b35aa746f4f9b8d9c0b22/apply",
              description:
                "Ariza uchun havola; faqat bu vakansiya uchun status=active forma bo‘lsa. Aks holda null",
            },
            applicationFormAvailable: {
              type: "boolean",
              description: "true bo‘lsa, faol ariza formasi bor va applicationFormUrl beriladi",
            },
            title: { type: "string" },
            experience: { type: "string" },
            minAge: { type: "number" },
            maxAge: { type: "number" },
            salary: { type: "string" },
            isOpen: { type: "boolean", example: true },
            descriptionDelta: { type: "object", additionalProperties: true },
            responsibilitiesDelta: { type: "object", additionalProperties: true },
            advantagesDelta: { type: "object", additionalProperties: true },
            skills: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        VacancyCreateInput: {
          type: "object",
          required: [
            "title",
            "experience",
            "minAge",
            "maxAge",
            "salary",
            "descriptionDelta",
            "responsibilitiesDelta",
            "advantagesDelta",
            "skills",
          ],
          properties: {
            title: { type: "string", example: "Frontend Developer" },
            experience: { type: "string", example: "2+ years" },
            minAge: { type: "number", example: 20 },
            maxAge: { type: "number", example: 35 },
            salary: { type: "string", example: "8 000 000 - 12 000 000 UZS" },
            isOpen: { type: "boolean", example: true },
            descriptionDelta: { type: "object", additionalProperties: true },
            responsibilitiesDelta: { type: "object", additionalProperties: true },
            advantagesDelta: { type: "object", additionalProperties: true },
            skills: {
              type: "array",
              items: { type: "string" },
              example: ["JavaScript", "React", "Git"],
            },
          },
        },
        VacancyUpdateInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            experience: { type: "string" },
            minAge: { type: "number" },
            maxAge: { type: "number" },
            salary: { type: "string" },
            isOpen: { type: "boolean" },
            descriptionDelta: { type: "object", additionalProperties: true },
            responsibilitiesDelta: { type: "object", additionalProperties: true },
            advantagesDelta: { type: "object", additionalProperties: true },
            skills: { type: "array", items: { type: "string" } },
          },
        },
        ApplicationFormQuestion: {
          type: "object",
          required: ["question", "type"],
          properties: {
            _id: { type: "string" },
            question: { type: "string", example: "Ish tajribangiz nechchi yil?" },
            type: {
              type: "string",
              enum: [
                "text",
                "textarea",
                "number",
                "email",
                "phone",
                "select",
                "multiselect",
                "radio",
                "checkbox",
                "date",
                "time",
                "datetime",
                "month",
                "week",
                "file",
                "image",
                "video",
                "pdf",
                "url",
                "password",
                "rating",
                "boolean",
                "range",
              ],
            },
            required: { type: "boolean", example: true },
            options: {
              type: "array",
              items: { type: "string" },
              example: ["Ha", "Yo'q"],
            },
            placeholder: { type: "string", example: "Javobni kiriting" },
            order: { type: "number", example: 1 },
          },
        },
        ApplicationForm: {
          type: "object",
          properties: {
            _id: { type: "string" },
            applicationFormUrl: {
              type: "string",
              example: "https://form.ishber.uz/vacancies/681b35aa746f4f9b8d9c0b22/apply",
            },
            vacancyId: { type: "string" },
            nom: { type: "string", example: "Frontend developer so'rovnomasi" },
            questions: {
              type: "array",
              items: { $ref: "#/components/schemas/ApplicationFormQuestion" },
            },
            status: { type: "string", enum: ["active", "inactive"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ApplicationFormCreateInput: {
          type: "object",
          required: ["vacancyId", "nom", "questions"],
          properties: {
            vacancyId: { type: "string" },
            nom: { type: "string", example: "Frontend developer so'rovnomasi" },
            questions: {
              type: "array",
              items: { $ref: "#/components/schemas/ApplicationFormQuestion" },
            },
            status: { type: "string", enum: ["active", "inactive"], example: "active" },
          },
        },
        ApplicationFormUpdateInput: {
          type: "object",
          properties: {
            vacancyId: { type: "string" },
            nom: { type: "string" },
            questions: {
              type: "array",
              items: { $ref: "#/components/schemas/ApplicationFormQuestion" },
            },
            status: { type: "string", enum: ["active", "inactive"] },
          },
        },
        ApplicationFormSendSmsInput: {
          type: "object",
          required: ["phone", "vacancyId"],
          properties: {
            phone: { type: "string", example: "+998901112233" },
            vacancyId: { type: "string", example: "681b35aa746f4f9b8d9c0b22" },
          },
        },
        PublicVacancyFormResponse: {
          type: "object",
          properties: {
            vacancy: { $ref: "#/components/schemas/Vacancy" },
            form: { $ref: "#/components/schemas/ApplicationForm" },
          },
        },
        PublicApplicationAnswer: {
          type: "object",
          required: ["questionId", "value"],
          properties: {
            questionId: { type: "string", description: "Question subdocument _id from the form" },
            value: {
              description: "string, number, boolean, string[], etc. depending on question type",
            },
          },
        },
        PublicApplicationSubmitInput: {
          type: "object",
          required: ["answers"],
          properties: {
            phone: {
              type: "string",
              description:
                "Ixtiyoriy. Bo‘lmasa, formadagi `phone` turidagi savoldan olinadi. SMS uchun ishlatiladi.",
              example: "+998901112233",
            },
            answers: {
              type: "array",
              items: { $ref: "#/components/schemas/PublicApplicationAnswer" },
            },
          },
        },
        ContactLogEntry: {
          type: "object",
          properties: {
            _id: { type: "string" },
            text: { type: "string", example: "Nomzod bilan gaplashdim — suhbat belgilandi" },
            outcome: { type: "string", example: "keyingi hafta intervyu" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ApplicationSubmissionStatusPatch: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["accepted", "rejected"] },
            rejectionReason: {
              type: "string",
              description: "status=rejected bo‘lsa majburiy",
            },
            sendSms: {
              type: "boolean",
              default: true,
              description: "false bo‘lsa SMS yuborilmaydi",
            },
          },
        },
        ApplicationSubmissionContactNoteInput: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", example: "Qo‘ng‘iroq qildim, javob bermadi" },
            outcome: { type: "string", example: "ertaga qayta urinaman" },
          },
        },
        ApplicationSubmissionUpdateInput: {
          type: "object",
          description: "Kamida applicantPhone yoki answers kerak",
          properties: {
            applicantPhone: { type: "string", example: "+998901112233" },
            answers: {
              type: "array",
              description: "To‘liq javoblar ro‘yxati (forma validatsiyasi bilan)",
              items: { $ref: "#/components/schemas/PublicApplicationAnswer" },
            },
          },
        },
        ApplicationSubmission: {
          type: "object",
          properties: {
            _id: { type: "string" },
            vacancyId: { type: "string" },
            applicationFormId: { type: "string" },
            submissionNumber: { type: "number", description: "Vakansiya bo‘yicha tartib raqami (SMS №)" },
            displayNumber: { type: "string", description: "Ko‘rinish uchun № (submissionNumber yoki qisqa id)" },
            vacancyTitle: { type: "string", description: "GET javobida qo‘shiladi" },
            status: { type: "string", enum: ["pending", "accepted", "rejected"] },
            rejectionReason: { type: "string" },
            applicantPhone: { type: "string" },
            contactedAt: { type: "string", format: "date-time", nullable: true },
            contactLog: {
              type: "array",
              items: { $ref: "#/components/schemas/ContactLogEntry" },
            },
            answers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionId: { type: "string" },
                  value: {},
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        InterviewCreateInput: {
          type: "object",
          required: [
            "candidateName",
            "candidatePhone",
            "vacancyId",
            "topic",
            "interviewerName",
            "addressMode",
            "scheduledAt",
          ],
          properties: {
            applicationSubmissionId: { type: "string" },
            candidateName: { type: "string" },
            candidatePhone: { type: "string", example: "+998901112233" },
            vacancyId: { type: "string" },
            topic: { type: "string", example: "Texnik suhbat" },
            interviewerName: { type: "string", example: "Dilshod" },
            addressMode: { type: "string", enum: ["text", "url", "place"] },
            addressText: { type: "string", description: "Matn yoki URL (mode ga qarab)" },
            placeLabel: { type: "string", description: "Kartadan tanlangan joy nomi" },
            coordinates: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            scheduledAt: {
              type: "string",
              format: "date-time",
              description: "ISO 8601 (Asia/Tashkent bo‘yicha frontend hisoblab yuborishi mumkin)",
            },
          },
        },
        InterviewUpdateInput: {
          type: "object",
          properties: {
            scheduledAt: { type: "string", format: "date-time" },
            topic: { type: "string" },
            interviewerName: { type: "string" },
            candidateName: { type: "string" },
            candidatePhone: { type: "string" },
            addressMode: { type: "string", enum: ["text", "url", "place"] },
            addressText: { type: "string" },
            placeLabel: { type: "string" },
            coordinates: {
              type: "object",
              properties: { lat: { type: "number" }, lng: { type: "number" } },
            },
            status: { type: "string", enum: ["scheduled", "completed", "cancelled", "no_show"] },
            rating: { type: "number", minimum: 1, maximum: 5, nullable: true },
            passed: { type: "boolean", nullable: true },
            rescheduleRequested: { type: "boolean" },
            adminNotes: { type: "string" },
            markEvaluated: {
              type: "boolean",
              description: "true bo‘lsa evaluatedAt va (status scheduled bo‘lsa) completed",
            },
          },
        },
        Interview: {
          type: "object",
          properties: {
            _id: { type: "string" },
            applicationSubmissionId: { type: "string", nullable: true },
            candidateName: { type: "string" },
            candidatePhone: { type: "string" },
            vacancyId: { type: "string" },
            vacancyTitle: { type: "string" },
            topic: { type: "string" },
            interviewerName: { type: "string" },
            addressMode: { type: "string", enum: ["text", "url", "place"] },
            addressText: { type: "string" },
            placeLabel: { type: "string" },
            coordinates: { type: "object" },
            scheduledAt: { type: "string", format: "date-time" },
            status: { type: "string", enum: ["scheduled", "completed", "cancelled", "no_show"] },
            reminderSmsSent: { type: "boolean" },
            reminderSmsSentAt: { type: "string", format: "date-time", nullable: true },
            rating: { type: "number", nullable: true },
            passed: { type: "boolean", nullable: true },
            rescheduleRequested: { type: "boolean" },
            adminNotes: { type: "string" },
            evaluatedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { setupSwagger };
