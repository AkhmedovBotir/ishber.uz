import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getPublicVacancyForm,
  submitPublicApplication,
  ApiError,
} from '../api/publicVacancies.js'
import ApplicationQuestionInput from '../components/ApplicationQuestionInput.jsx'
import AppHeader from '../components/AppHeader.jsx'
import SuccessSideConfetti from '../components/SuccessSideConfetti.jsx'
import {
  buildAnswersPayload,
  initialAnswerValue,
} from '../lib/formAnswers.js'

function sortQuestions(questions) {
  return [...(questions || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  )
}

export default function VacancyApplyPage() {
  const { vacancyId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vacancy, setVacancy] = useState(null)
  const [form, setForm] = useState(null)
  const [values, setValues] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [done, setDone] = useState(null)

  const questions = useMemo(() => sortQuestions(form?.questions), [form])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setDone(null)
    setSubmitError(null)

    getPublicVacancyForm(vacancyId)
      .then((data) => {
        if (cancelled) return
        setVacancy(data.vacancy)
        setForm(data.form)
        const next = {}
        for (const q of sortQuestions(data.form?.questions)) {
          next[String(q._id)] = initialAnswerValue(q)
        }
        setValues(next)
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e instanceof ApiError ? e.message : 'Yuklashda xato'
        setError(msg)
        setVacancy(null)
        setForm(null)
        setValues({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [vacancyId])

  const setAnswer = useCallback((questionId, v) => {
    setValues((prev) => ({ ...prev, [questionId]: v }))
    setSubmitError(null)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    const { answers, clientError } = buildAnswersPayload(questions, values)
    if (clientError) {
      setSubmitError(clientError)
      return
    }
    setSubmitting(true)
    try {
      const submission = await submitPublicApplication(vacancyId, { answers })
      setDone(submission)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Yuborishda xato')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResubmit = useCallback(() => {
    setDone(null)
    setSubmitError(null)
    const next = {}
    for (const q of questions) {
      next[String(q._id)] = initialAnswerValue(q)
    }
    setValues(next)
  }, [questions])

  if (loading) {
    return (
      <div className="min-h-svh bg-[#f8f9fa] text-zinc-600">
        <AppHeader primaryTitle="So‘rovnoma" secondary="Yuklanmoqda…" />
        <div className="flex justify-center px-4 py-24">
          <p className="text-sm">So‘rovnoma yuklanmoqda…</p>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-svh bg-[#f8f9fa] text-zinc-900">
        <AppHeader primaryTitle="So‘rovnoma" secondary="Xato" />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
          >
            <h1 className="text-lg font-medium text-zinc-900">
              Formani ochib bo‘lmadi
            </h1>
            <p className="mt-3 text-sm text-zinc-600">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-block text-sm font-medium text-blue-700 underline-offset-4 hover:underline"
            >
              Bosh sahifaga
            </Link>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[#f8f9fa] text-zinc-900 antialiased">
      <AppHeader
        primaryTitle={vacancy?.title || 'Vakansiya'}
        secondary={form.nom}
      />

      {done && (
        <>
          <div
            className="pointer-events-none fixed inset-0 z-[190] bg-gradient-to-b from-emerald-50/95 via-teal-50/90 to-emerald-100/95"
            aria-hidden
          />
          <SuccessSideConfetti seed={String(done?._id ?? 'ok')} />
          <div className="pointer-events-none fixed inset-0 z-[210] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="pointer-events-auto mx-auto max-w-md rounded-xl border border-emerald-200/80 bg-white/90 px-6 py-8 text-center shadow-lg backdrop-blur-sm sm:px-8 sm:py-10"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-900 sm:text-3xl">
                Arizangiz qabul qilindi
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-emerald-800/90 sm:text-base">
                Rahmat! Ma’lumotlaringiz saqlandi. Agar xato topshirgan
                bo‘lsangiz, formani qayta to‘ldirishingiz mumkin.
              </p>
              <motion.button
                type="button"
                onClick={handleResubmit}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 400, damping: 28 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full rounded-md border border-emerald-300 bg-white px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                Qayta topshirish
              </motion.button>
            </motion.div>
          </div>
        </>
      )}

      <main
        className={`mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 ${done ? 'hidden' : ''}`}
        aria-hidden={!!done}
      >
        <AnimatePresence mode="wait">
          {!done && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <form
                onSubmit={handleSubmit}
                className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="space-y-6">
                  {questions.map((q, i) => (
                    <motion.div
                      key={String(q._id)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.35) }}
                    >
                      <ApplicationQuestionInput
                        question={q}
                        value={values[String(q._id)]}
                        onChange={(v) => setAnswer(String(q._id), v)}
                      />
                    </motion.div>
                  ))}
                </div>

                {submitError && (
                  <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {submitError}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.01 }}
                  whileTap={{ scale: submitting ? 1 : 0.99 }}
                  className="mt-8 w-full rounded-md bg-blue-600 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? 'Yuborilmoqda…' : 'Arizani yuborish'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
