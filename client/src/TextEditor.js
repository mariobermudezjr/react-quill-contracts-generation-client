import { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
// import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const SAVE_INTERVAL_MS = 2000
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
]

export default function TextEditor() {
  const { id: documentId } = useParams()
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()

  // useEffect(() => {
  //   const s = io('http://localhost:3001')
  //   setSocket(s)

  //   return () => {
  //     s.disconnect()
  //   }
  // }, [])

  useEffect(() => {
    //if (socket == null || quill == null) return
    if (quill == null) return
    quill.setContents(document)
    quill.enable()
  }, [quill, documentId])

  useEffect(() => {
    if (socket == null || quill == null) return

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents())
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket, quill])

  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (delta) => {
      quill.updateContents(delta)
      console.log(delta)
    }
    socket.on('receive-changes', handler)

    return () => {
      socket.off('receive-changes', handler)
    }
  }, [socket, quill])

  useEffect(() => {
    if (quill == null) return

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'api') {
        console.log('An API call triggered this change.')
        // console.log('New Data: ', delta)
        // console.log('Old Data: ', oldDelta)
      } else if (source === 'user') {
        console.log('A user action triggered this change.')
        console.log('New Data: ', delta)
        console.log('Old Data: ', oldDelta)
        if (delta.ops.length === 1) {
          console.log('Actual Data Object: ', delta.ops[0].insert)
        } else if (delta.ops[1].insert !== undefined) {
          const copyOldDelta = quill.getText(0, delta.ops[0].retain)
          const parseText = copyOldDelta.replace(/(\r\n|\n|\r)/gm, '') + delta.ops[1].insert
          console.log('Text to Parse: ', parseText)
          if (checkIfStringHasSpecialChar(parseText)) {
            console.log('Contains Special Characters!')
          }
        } else {
          console.log('Text to Parse: ', quill.getText(0, delta.ops[0].retain))
        }
      }
    })
  })

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return

    wrapper.innerHTML = ''
    const editor = document.createElement('div')
    wrapper.append(editor)
    const q = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS },
    })
    q.disable()
    q.setText('Loading...')
    setQuill(q)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Delta: ')

    // if (form.prompt && form.photo) {
    //   setLoading(true)
    //   try {
    //     const response = await fetch('https://dall-e-2-server.herokuapp.com/api/v1/post', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ ...form }),
    //     })

    //     await response.json()
    //     alert('Success')
    //     navigate('/')
    //   } catch (err) {
    //     alert(err)
    //   } finally {
    //     setLoading(false)
    //   }
    // } else {
    //   alert('Please generate an image with proper details')
    // }
  }
  function checkIfStringHasSpecialChar(_string) {
    let spChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/
    if (spChars.test(_string)) {
      return true
    } else {
      return false
    }
  }

  return (
    <div>
      <div>
        <button className="create-contract" type="button" onClick={handleSubmit}>
          Create Contract
        </button>
      </div>
      <div className="container" ref={wrapperRef}></div>
    </div>
  )
}
