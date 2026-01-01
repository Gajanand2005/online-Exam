import { Button } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'

const AllResult = () => {
  return (
    <>
      <div className="  mt-50 flex items-center justify-center ">

      {/* Login Card */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Principal 
        </h2>
        <div className='result-button'>
            <h3 className='text-center mt-2 mb-5'>See All Results Here</h3>
            <div className='text-center'>
                <Link to='/see-result'>
                <Button className='!bg-blue-500 !text-white !px-4 !py-2 !rounded-md hover:!bg-blue-600 '>See Results</Button>
                </Link>
            </div>
        </div>
        
           <div className='exam-button'>
            <h3 className='text-center mt-2 mb-5'>See All Results Here</h3>
            <div className='text-center'>
                <Link to='/see-exam'>
                <Button className='!bg-blue-500 !text-white !px-4 !py-2 !rounded-md hover:!bg-blue-600 '>See All exams</Button>
                </Link>
            </div>
        </div>
          
     
        </div>
        </div> 
    </>
  )
}

export default AllResult
