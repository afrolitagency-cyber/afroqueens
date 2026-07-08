// app/(public)/contact/page.tsx
import ContactForm from './ContactForm'
import styles from './contact.module.css'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact — Afroqueens FM',
  description: 'Get in touch with the Afroqueens FM team. Press enquiries, collaborations, submissions.',
  slug: 'contact',
})

export default function ContactPage() {
  return (
    <main style={{ paddingTop: '100px' }}>
      <div className={styles.hero}>
        <div className={`si ${styles.heroInner}`}>
          <div className="sl">Get In Touch</div>
          <h1 className="st">Let's <em>Talk</em></h1>
          <p className={styles.sub}>
            Press enquiries, artist submissions, collaborations, or just to say hello — we read everything.
          </p>
        </div>
      </div>

      <div className={`si ${styles.layout}`}>
        <div className={styles.info}>
          <div className={styles.infoBlock}>
            <div className={styles.infoLabel}>General</div>
            <p className={styles.infoText}>hello@afroqueens.fm</p>
          </div>
          <div className={styles.infoBlock}>
            <div className={styles.infoLabel}>Press & Media</div>
            <p className={styles.infoText}>press@afroqueens.fm</p>
          </div>
          <div className={styles.infoBlock}>
            <div className={styles.infoLabel}>Artist Submissions</div>
            <p className={styles.infoText}>music@afroqueens.fm</p>
          </div>
          <div className={styles.infoBlock}>
            <div className={styles.infoLabel}>Response Time</div>
            <p className={styles.infoText}>Within 3–5 business days</p>
          </div>
        </div>

        <ContactForm />
      </div>
    </main>
  )
}
