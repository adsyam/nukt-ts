import { doc, onSnapshot } from "firebase/firestore"
import { getDownloadURL, listAll, ref } from "firebase/storage"
import { useEffect, useState } from "react"
// import { moment as format } from "moment";
import moment from "moment-timezone"
import { AiOutlineDelete, AiOutlineEdit, AiOutlineMore } from "react-icons/ai"
import { fileDB, textDB } from "../../config/firebase"
import { useAuthContext } from "../../contexts/AuthContext"
import { useDBContext } from "../../contexts/DBContext"

export default function Reviews({ comments, id }) {
  const { user } = useAuthContext()
  const { addReview, deleteReview, updateReview } = useDBContext()
  const [visible, setVisible] = useState(10)
  const [imageUrl, setImageUrl] = useState("")
  const [reviewInput, setReviewInput] = useState("")
  const [editReview, setEditReview] = useState("")
  const [reviewData, setReviewData] = useState([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isEdit, setIsEdit] = useState(null)
  const [options, setOptions] = useState(null)

  useEffect(() => {
    const listRef = ref(fileDB, `${user?.uid}/profileImage/`)
    listAll(listRef).then((response) => {
      getDownloadURL(response.items[0]).then((url) => {
        setImageUrl(url)
      })
    })
  }, [])

  useEffect(() => {
    const reviewsCollectionRef = doc(textDB, "Reviews", id)
    onSnapshot(reviewsCollectionRef, async (snapshot) => {
      const newReviewData = await Promise.all(
        Object.keys(snapshot._document.data.value.mapValue.fields).map(
          async (key) => {
            const {
              createdAt: { timestampValue: createdAt },
              id: { stringValue: userId },
              review: { stringValue: review },
              username: { stringValue: username },
              isEdited: { booleanValue: isEdited },
            } = snapshot._document.data.value.mapValue.fields[key].mapValue
              .fields

            const listRef = ref(fileDB, `${userId}/profileImage/`)
            try {
              const response = await listAll(listRef)
              const url = response.items[0]
                ? await getDownloadURL(response.items[0])
                : null

              return {
                userId: userId,
                reviewId: key,
                username,
                review,
                createdAt:
                  createdAt !== null
                    ? moment.tz(createdAt, "Asia/Singapore").toDate()
                    : null,
                url,
                isEdited,
              }
            } catch (error) {
              console.error("Error fetching download URL:", error)
              return null
            }
          }
        )
      )

      const filteredReviewData = newReviewData.filter(Boolean)
      filteredReviewData.sort((a, b) => b.createdAt - a.createdAt)
      setReviewData(filteredReviewData)
    })
  }, [isSubmitted, id])

  const handleSubmit = (e) => {
    e.preventDefault()
    addReview(user?.uid, id, user?.displayName, reviewInput)
    setReviewInput("")
    setIsSubmitted(!isSubmitted)
  }

  const handleEdit = (e, reviewId) => {
    e.preventDefault()

    updateReview(reviewId, id, editReview)
    setIsEdit(null), setOptions(null), setEditReview("")
  }

  const handleDelete = (e, reviewId) => {
    e.preventDefault()
    deleteReview(reviewId, id)
  }

  const toggleLoadComments = () => {
    if (visible === Infinity) {
      setVisible(10)
    } else {
      setVisible(Infinity)
    }
  }

  if (!reviewData) return

  return (
    <section
      className="text-white w-full lg:max-w-[50%] p-[2rem]
      flex flex-1 flex-col justify-center items-start"
    >
      <div className="flex flex-col gap-[1.5rem] max-w-full">
        <h2 className="font-bold">{reviewData.length} Reviews</h2>
        <div className="flex gap-3">
          <img
            src={
              imageUrl ||
              user.photoURL ||
              "../../assets/profile-placeholder.svg"
            }
            alt=""
            className="rounded-full h-[50px]"
          />
          <div className="flex flex-col gap-3">
            <textarea
              placeholder="Write a review"
              name=""
              cols="120"
              rows="2"
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              className="text-white resize-none outline-none rounded-md p-2 w-full
              bg-black/80 focus:outline-white/30"
            />
            <div className="w-full flex gap-5">
              <button
                onClick={(e) => handleSubmit(e)}
                className={`w-max  px-[1rem] rounded-md hover:bg-white/50 ${
                  reviewInput.length === 0 ? "bg-white/10" : "bg-white/50"
                }`}
              >
                Submit
              </button>
              <button
                onClick={() => setReviewInput("")}
                className="w-max bg-white/10 px-[1rem] rounded-md hover:bg-white/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[1300px]">
          {reviewData.slice(0, visible).map((data) => (
            <div
              key={data.reviewId}
              className="w-full flex justify-between items-center"
            >
              <div className="flex gap-4 mb-6">
                <div className="rounded-full w-[45px] h-[45px] overflow-hidden">
                  <img
                    src={data?.url}
                    alt={data?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isEdit !== data.reviewId ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3 items-center">
                      <p>{data?.username}</p>
                      <p className="text-white/50 text-sm">
                        posted {moment(data?.createdAt).fromNow()}{" "}
                        {data?.isEdited && "(edited)"}
                      </p>
                    </div>
                    <p>{data?.review}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <textarea
                      placeholder="Write a review"
                      name=""
                      cols="120"
                      rows="2"
                      value={editReview || data?.review}
                      onChange={(e) => setEditReview(e.target.value)}
                      className="text-white resize-none outline-none rounded-md p-2 w-full
              bg-black/80 focus:outline-white/30"
                    />
                    <div className="w-full flex gap-5">
                      <button
                        onClick={(e) => handleEdit(e, data?.reviewId)}
                        className={`w-max  px-[1rem] rounded-md hover:bg-white/50 ${
                          editReview.length === 0
                            ? "bg-white/10"
                            : "bg-white/50"
                        }`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => (
                          setIsEdit(null), setOptions(null), setEditReview("")
                        )}
                        className="w-max bg-white/10 px-[1rem] rounded-md hover:bg-white/50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {user?.uid === data?.userId && isEdit !== data.reviewId && (
                <div className="relative">
                  <AiOutlineMore
                    onClick={() =>
                      setOptions((prevOptions) =>
                        prevOptions === data.reviewId ? null : data.reviewId
                      )
                    }
                    className="w-[25px] h-[25px] cursor-pointer font-bold"
                  />
                  <div
                    className={`absolute bg-white/10 p-1 rounded-md top-0 right-5
                  ${options === data.reviewId ? "block" : "hidden"}`}
                  >
                    <button
                      onClick={(e) =>
                        setIsEdit((prevOptions) =>
                          prevOptions === data.reviewId ? null : data.reviewId
                        )
                      }
                      className="flex items-center gap-1 hover:bg-white/40 w-full rounded-md p-1 text-sm"
                    >
                      <AiOutlineEdit /> Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, data?.reviewId)}
                      className="flex items-center gap-1 hover:bg-white/40 w-full rounded-md p-1 text-sm"
                    >
                      <AiOutlineDelete /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* {comments.slice(0, visible).map((comment, i) => (
            <>
              {containsHtmlTags(
                comment?.snippet?.topLevelComment?.snippet?.textDisplay
              ) ? (
                ""
              ) : (
                <div key={comment?.id} className="flex gap-[1rem] mb-[1.5rem]">
                  <img
                    src={
                      comment?.snippet?.topLevelComment?.snippet
                        ?.authorProfileImageUrl || "https://i.pravatar.cc/50"
                    }
                    alt=""
                    className="rounded-full w-[45px] h-[45px]"
                  />
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2>
                        {
                          comment?.snippet?.topLevelComment?.snippet
                            ?.authorDisplayName
                        }
                      </h2>
                      <p className="text-white/50 text-sm">
                        posted{" "}
                        {moment(
                          comment?.snippet?.topLevelComment?.snippet
                            ?.publishedAt
                        ).fromNow()}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{ whiteSpace: "pre-line" }}
                        className="text-[.9rem]"
                      >
                        {
                          comment?.snippet?.topLevelComment?.snippet
                            ?.textDisplay
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ))} */}
        </div>
      </div>
      <button
        onClick={toggleLoadComments}
        className="bg-white/30 w-max mx-auto mt-[1rem] p-[.3rem] rounded-md"
      >
        {visible === Infinity ? "Load less reviews" : "Load more reviews"}
      </button>
    </section>
  )
}
