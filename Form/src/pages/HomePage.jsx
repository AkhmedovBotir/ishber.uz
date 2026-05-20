import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader.jsx'

const PHONE = '+998939652015'

export default function HomePage() {
  return (
    <div className="min-h-svh bg-[#f8f9fa] text-zinc-900 antialiased">
      <AppHeader
        variant="bosh"
        primaryTitle="ishber.uz"
        secondary="Vakansiya"
      />
      <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-lg flex-col justify-center px-4 py-10 sm:min-h-[calc(100svh-4rem)] sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm"
        >
          <p className="text-base leading-relaxed text-zinc-800 sm:text-lg">
            Vakansiyaga topshirish uchun{' '}
            <a
              href={`tel:${PHONE}`}
              className="whitespace-nowrap font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
            >
              {PHONE}
            </a>{' '}
            shu raqamga bog‘laning.
          </p>
        </motion.div>
      </main>
    </div>
  )
}
