import { doc, onSnapshot } from "firebase/firestore"
import { useEffect, useRef, useState } from "react"

import { Footer, Reviews, VideoDescriptions, VideosGrid } from "../components"
import { textDB } from "../config/firebase"
import { AuthContextProps, useAuthContext } from "../contexts/AuthContext"
import { DBContextProps, useDBContext } from "../contexts/DBContext"
import { DataContextProps, useDataContext } from "../contexts/DataContext"
import {
  useFetchRelatedVideos,
  useFetchStats,
  useFetchVideoComments,
} from "../hooks/videoHooks"

export default function WatchVideo() {
  const id = new URLSearchParams(window.location.search).get("v") ?? ""
  const [historyToggle, setHistoryToggle] = useState(true)

  const videoDetails = useFetchStats(id)
  const videos = useFetchRelatedVideos(id)
  const comments = useFetchVideoComments(id)
  const { user } = useAuthContext() as AuthContextProps
  const { sidebar } = useDataContext() as DataContextProps
  const { addHistoryOrLibrary } = useDBContext() as DBContextProps
  const videoRef = useRef(null)

  useEffect(() => {
      const unsubscribe = onSnapshot(doc(textDB, "Users", user?.uid), (doc) =>
        setHistoryToggle(doc.data()?.storeHistory)
      )
  }, [user, user?.uid])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (historyToggle && user?.uid) {
        const nonNullContentId = id ?? ""
        addHistoryOrLibrary(user?.uid, "history", "videos", nonNullContentId)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [addHistoryOrLibrary, historyToggle, id, user?.uid, videoDetails])

  if (!videoDetails) {
    return (
      <div className="w-full h-[100vh] bg-[#0d0d0d] grid place-items-center">
        <h1 className="text-[2rem] text-white">Loading...</h1>
      </div>
    )
  }

  return (
    <>
      <section
        className={`min-h-[100vh] bg-[#0d0d0d] ${
          sidebar
            ? "translate-x-[15rem] origin-left duration-300 w-[87%]"
            : "w-full origin-right duration-300"
        }`}
      >
        <div className="flex flex-col gap-3 pt-[5rem]">
          <div className="flex-1">
            <div className="w-full p-[1rem]">
              <div className="">
                <iframe
                  title="YouTube video player"
                  ref={videoRef}
                  key={id}
                  src={`https://www.youtube.com/embed/${id}`}
                  allowFullScreen
                  frameBorder={0}
                  className="aspect-video w-full h-full rounded-[10px]"
                />
              </div>
              <VideoDescriptions videoDetail={videoDetails} />
            </div>
          </div>
          <div className="flex flex-col items-baseline flex-1 w-full lg:flex-row">
            <Reviews comments={comments} id={id} />
            <div className="flex flex-col flex-1">
              <p className="text-white text-center text-[1.5rem] font-medium">
                Related Videos
              </p>
              <div className="">
                <VideosGrid videos={videos} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
