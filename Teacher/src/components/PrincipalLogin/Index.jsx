import { Button } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'

const Login = () => {
  return (
    <>
     <div className="  mt-50 flex items-center justify-center ">

      {/* Login Card */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Login
        </h2>
        <p className="text-center text-gray-500 mt-1">
          Welcome back! Please login
        </p>

        {/* Form */}
        <form className="mt-6 space-y-4">

          {/* Username */}
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <input
              type="text"
              placeholder="Enter Teacher Name"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500  border-gray-300"
            />
          </div>

           <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="text"
              placeholder="Enter email"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500  border-gray-300"
            />
          </div>
        <div className='text-center'>
            <Link to='/see-all-result'>
            <Button className='!text-black !bg-zinc-300 hover:!bg-indigo-500/50 rounded-md !text-[15px] '>Login</Button>
            </Link>
        </div>
          
          </form>
          </div>
          </div> 
    </>
  )
}

export default Login
