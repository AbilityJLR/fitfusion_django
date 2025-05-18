'use client'

import { getProfile } from '../utils/profile'
import getRecommendations from '../utils/recommendations'
import { getSearch } from '../utils/rag-search'
import getGenAI from '../utils/gen_ai'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Dashboard.module.css'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import '../style.css'

export default function Dashboard() {
  const router = useRouter()
  const [search, setSearch] = useState([])
  const [chat, setChat] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [userData, setUserData] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [error, setError] = useState(null)
  const [clicked, setClicked] = useState(false)

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const recommendationData = await getRecommendations()
      if (recommendationData) {
        console.log('Recommendations loaded:', recommendationData)
        setRecommendations(recommendationData)
        localStorage.setItem('recommendations', JSON.stringify(recommendationData))
      }
    } catch (err) {
      console.log('Error loading recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('recommendations')
    if (stored) {
      setRecommendations(JSON.parse(stored))
    } else {
      loadRecommendations()
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const userProfile = await getProfile()
        setUserData(userProfile)
      } catch (err) {
        setError('Failed to fetch profile data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const onSubmitChat = async (e) => {
    e.preventDefault()
    setChatResponse('')
    setClicked(true)
    setIsStreaming(true)
    setSearching(true);

    (async () => {

      try {
        await getGenAI(chat, (streamText) => {
          setChatResponse(streamText)
        })
      } catch (err) {
        console.log('error', err)
      } finally {
        setIsStreaming(false)
      }
    })();

    (async () => {
      try {
        const searchResults = await getSearch(chat)
        console.log(searchResults)
        setSearch(searchResults)
      } catch (error) {
        console.error(error)
      } finally {
        setSearching(false)
      }
    })();
  }

  const handleRecommendBotton = async () => {
    try {
      const recommendationData = await getRecommendations()
      if (recommendationData) {
        console.log('Recommendations loaded:', recommendationData)
        setRecommendations(recommendationData)
      }
    } catch (err) {
      console.log('Error loading recommendations:', err)
    }
  }

  const getEmbedUrl = (youtube_url) => {
    if (!youtube_url || typeof youtube_url !== "string") return null;
    const video_id = youtube_url.split('/').pop();
    return `https://www.youtube.com/embed/${video_id}`
  }

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <div className={styles.dashboard}>
          {userData && (
            <div className={styles.dashboardTitle}>
              <h1>Dashboard {userData.username}</h1>
              <div className={styles.actions}>
                <Link href="/profile">
                  <button className='btn btn-secondary'>View Profile</button>
                </Link>
                <Link href="/profile/setup">
                  <button className='btn btn-primary'>Setup Profile</button>
                </Link>
              </div>
            </div>
          )}

          <div className={styles.dashboardContent}>
            <h2>Welcome to your Fitness Dashboard</h2>
            <p>Here you can get recommendations, and chat with our AI assistant.</p>
            <button className='btn btn-primary' onClick={handleRecommendBotton}>Recommend me</button>
            {loading ? 'loading recommendations...' : ""}
            <div>
              {recommendations?.detailedWeeklySchedule &&
                Object.entries(recommendations.detailedWeeklySchedule).map(([day, data], index) => (
                  <div key={index} className={styles.dayTable}>
                    <h3 className={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                    <p><strong>Focus:</strong> {data.focus}</p>
                    <p>{data.description}</p>
                    <table>
                      <thead>
                        <tr>
                          <th>Exercise</th>
                          <th>Sets</th>
                          <th>Reps</th>
                          <th>Intensity</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.exercises?.map((item, i) => (
                          <tr key={i}>
                            <td>{item.name}</td>
                            <td>{item.sets}</td>
                            <td>{item.reps}</td>
                            <td>{item.intensity}</td>
                            <td>{item.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className={styles.cardioSection}>
                      <div><h4>Cardio</h4></div>
                      <hr className='line' />
                      <div><strong>Type:</strong> {data.cardio.type}</div>
                      <div><strong>Duration:</strong> {data.cardio.duration}</div>
                      <div><strong>Intensity:</strong> {data.cardio.intensity}</div>
                      <div><strong>Notes:</strong> {data.cardio.notes}</div>
                    </div>
                  </div>
                ))}
            </div>
            <hr className='line' />
            <h1 className='gradient-text'>Workout Recommendations</h1>
            <div className={styles.recBox}>
              {recommendations?.workoutRecommendations.map((item, index) => (
                <div key={index} className={styles.workoutRecommendationsContainer}>
                  <div className='recommend-header'><h3>{item.category}</h3><span><span className='badge-light'>{item.duration}</span><span className='badge-light'>{item.frequency}</span></span></div>
                  <div className='form-label text'>{item.description}</div>
                  {item.focus && <div className='form-label text text-small'><hr className='line' /><span className='badge'>focus</span> : {item.focus}</div>}
                  {item.intensity && <div className='form-label text text-small'><hr className='line' /><span className='badge'>intensity</span> : {item.intensity}</div>}
                </div>
              ))}
            </div>
            <hr className='line' />
            <h1 className='gradient-text'>Nutrition Recommendations</h1>
            <div className={styles.recBox}>
              {recommendations?.nutritionRecommendations.map((item, index) => (
                <div key={index} className={styles.workoutRecommendationsContainer}>
                  <div className='recommend-header'><h3>{item.category}</h3></div>
                  <div className='form-label text'>{item.recommendation}</div>
                  <hr className='line' />
                  <div className='form-label text text-small'><span className='badge'>reason</span> : {item.reasoning}</div>
                </div>
              ))}
            </div>
            <hr className='line' />
            <h1 className='gradient-text'>Lifestyle Recommendations</h1>
            <div className={styles.recBox}>
              {recommendations?.lifestyleRecommendations.map((item, index) => (
                <div key={index} className={styles.workoutRecommendationsContainer}>
                  <div className='recommend-header'><h3>{item.category}</h3></div>
                  <div className='form-label text'>{item.recommendation}</div>
                  <hr className='line' />
                  <div className='form-label text text-small'><span className='badge'>reason</span> : {item.reasoning}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chatSection}>
        <h3>Chat with FitFusion AI</h3>
        <form onSubmit={onSubmitChat}>
          <div className={styles.chatInput}>
            <input
              type='text'
              className='form-input'
              placeholder="Ask about fitness, nutrition, or workout plans..."
              onChange={(e) => { setChat(e.target.value) }}
              value={chat}
              disabled={isStreaming}
            />
            <button
              type='submit'
              className='btn btn-primary'
              disabled={isStreaming}
            >
              {isStreaming ? 'Getting response...' : 'Ask'}
            </button>
          </div>
        </form>
        <div className={styles.askContainer}>
          <div className={styles.chatResponse}>
            {chatResponse && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  a: ({ node, ...props }) => (
                    <a target="_blank" rel="noopener noreferrer" {...props} />
                  )
                }}
              >
                {chatResponse}
              </ReactMarkdown>
            )}
          </div>
          <div>
            {searching ? 'searching...' : (clicked && (
              <div className='gradient-text' style={{ marginTop: "1rem" }}><h1>Are you looking for these?</h1></div>
            ))}
            {search.map((item, index) => (
              <div key={index} className={styles.videoContentBox}>
                <div className='gradient-text'><h3>{item.metadata?.title}</h3></div>
                <div className='form-label text'>{item.metadata?.description}</div>
                <iframe width="100%" height="300px"
                  className={styles.video}
                  src={getEmbedUrl(item.metadata?.youtube_url)}
                  title="YouTube Shorts video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen>
                </iframe>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >
  )
} 
