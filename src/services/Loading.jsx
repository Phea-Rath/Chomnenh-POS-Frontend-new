import React from 'react'

const Loading = () => {
  return (
    <div className=' absolute transition-all duration-500 z-40 top-0 left-0 h-[100vh] w-[100vw] flex justify-center items-center bg-gray-800/50'>
      <span className="loading loading-ring loading-xl"></span>
    </div>
  )
}

export default Loading