'use client'

import Image from "next/image"
import Link from "next/link"
import styles from "./page.module.css"
import Navbar from "./components/Navbar"

export default function Home() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.background}>
        <div className={styles.gradientBg}></div>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.gridPattern}></div>
      </div>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          <div className={styles.betaTag}>AI-Powered Beta</div>
          <div className={styles.headTitle}>Fusion AI Fit for You</div>
          <div className={styles.headTitleText}>AI-powered fitness guide, recommending workouts and content to reach your goals.</div>
          <Link href="/login">
            <button className="btn btn-primary">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
