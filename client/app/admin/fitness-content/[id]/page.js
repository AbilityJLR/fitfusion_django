'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import styles from './EachContent.module.css'
import '../../../style.css'
import axios from 'axios'

export default function () {
  const params = useParams()
  const [data, setData] = useState({
    id: params.id,
    content_type: '',
    created_at: '',
    updated_at: '',
    description: '',
    difficulty_level: 0,
    title: '',
    url: '',
    youtube_url: '',
    equipment_required: '',
    duration_minutes: '',
    calories_burned: '',
    target_muscles: '',
  })

  useEffect(() => {
    const fetchDataById = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/fitness-content/${params.id}`, {
          withCredentials: true
        })
        console.log(response.data)
        setData(response.data)
      } catch (error) {
        console.log(error)
      }
    }

    fetchDataById()
  }, [])

  const getEmbedUrl = (youtube_url) => {
    if (!youtube_url || typeof youtube_url !== "string") return null;
    const video_id = youtube_url.split('/').pop();
    return `https://www.youtube.com/embed/${video_id}`
  }

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          <h2 className='gradient-text'>{data.title}</h2>
          <iframe width="100%" height="300px"
            className={styles.video}
            src={getEmbedUrl(data.youtube_url)}
            title="YouTube Shorts video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen>
          </iframe>
          <div className={styles.badgeContainer}>
            <p>
              <span className='badge-light'>{data.content_type}</span><span className='badge-light'>{
                data.difficulty_level === 1 ? 'Beginner' :
                  data.difficulty_level === 2 ? 'Intermediate' :
                    data.difficulty_level === 3 ? 'Advanced' :
                      data.difficulty_level === 4 ? 'Expert' : 'Professional'
              }</span>
            </p>
            <p>
              <span className='badge-light'>for {data.duration_minutes} minute</span>
              <span className='badge-light'>{data.calories_burned} calories burned</span>
              <span className='badge-light'>target {data.target_muscles}</span>
              <span className='badge-light'>require {data.equipment_required}</span>
            </p>
          </div>
          <div className={styles.description}>
            {data.description}
          </div>
          <div className={styles.bottomContainer}>
            <div>
              <span className='badge-light'>created : {new Date(data.updated_at).toLocaleString()}</span><span className='badge-light'>updated : {new Date(data.updated_at).toLocaleString()}</span>
            </div>
            <Link href="/admin/fitness-content">
              <button className='btn btn-primary'>Back</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
