import { Button } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'

const SeeEXam = () => {
  return (
    <>
   <div className='view'>
        <h1 className='text-center mt-5 font-bold capitalize text-3xl'>View Exam Component</h1>
          <div className="w-full border mt-4"></div>
           {/* ===== Exam Cards ===== */}
          <div className="exam-card flex gap-6 flex-wrap mt-6">

            {/* Card 1 */}
            <div className="w-[280px] p-5 border rounded-lg shadow-sm ml-5">
              <div className="mb-1">
                <label className="font-semibold">Exam Name :Hindi</label>
              </div>
               <div className="mb-2">
                <label className="font-semibold">class :12</label>
              </div>
               <div className="mb-2">
                <label className="font-semibold">marks :120</label>
                </div>
                 <div className="mb-3">
                <label className="font-semibold">Date : 12/23/2025</label>
                </div>
                <div className='Button-view'>
                    <Link to='/view'>
                    <Button className='!bg-blue-400 !text-black !px-4 !py-2 !rounded !mr-5 hover:!bg-zinc-300'>View Exam</Button>
                    </Link>
                </div>
              </div>

            
          

            
            {/* Card 3 */}
            <div className="w-[280px] p-5 border rounded-lg shadow-sm ml-5">
              <div className="mb-1">
                <label className="font-semibold">Exam Name :Hindi</label>
              </div>
               <div className="mb-2">
                <label className="font-semibold">class :12</label>
              </div>
               <div className="mb-2">
                <label className="font-semibold">marks :120</label>
                </div>
                 <div className="mb-3">
                <label className="font-semibold">Date : 12/23/2025</label>
                </div>
                <div className='Button-view'>
                    <Link to='/view'>
                    <Button className='!bg-blue-400 !text-black !px-4 !py-2 !rounded !mr-5 hover:!bg-zinc-300'>View Exam</Button>
                    </Link>
                </div>
              </div>

              </div>
   </div>

    </>
  )
}

export default SeeEXam
