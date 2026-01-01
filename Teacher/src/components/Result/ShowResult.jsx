import { Button } from '@mui/material'
import React from 'react'
import ClassResult from './ClassResult'


const ShowResult = () => {
  return (
    <>
      <div className='view'>
        <h1 className='text-center mt-5 font-bold capitalize text-3xl'>Result</h1>
          <div className="w-full border mt-4"></div>
           {/* ===== Exam Cards ===== */}
        
             <div className="flex justify-center mt-10">
            <div className="flex gap-6 w-[90%]">

              <ClassResult/>

             {/* <div className='result'>
              <h2 className='font-bold text-2xl mb-4'>Exam Name: JEE</h2>
              <div className='mb-3'>
                <span className='font-semibold'>Total Students Appeared: </span>
                <span>50</span>
              </div>
              <div className='mb-3'>
                <span className='font-semibold'>Average Score: </span>
                <span>75%</span>
              </div>
              <div className='mb-3'>
                <span className='font-semibold'>Highest Score: </span>
                <span>90%</span>
              </div>
              <div className='mb-3'>
                <span className='font-semibold'>Lowest Score: </span>
                <span>40%</span>
              </div>
              <div className='mb-3'>
                <span className='font-semibold'>Pass Percentage: </span>
                <span>80%</span>
              </div>
              <div className='mt-6'>
                <Button variant="contained" color="primary">
                  Download Report
                </Button>
              </div>
             </div> */}
            
              
            </div>
          </div>
                     
         
         
          </div>
    </>
  )
}

export default ShowResult
