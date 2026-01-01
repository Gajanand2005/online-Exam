import { Button } from '@mui/material';
import React from 'react'
import { FaPrint } from "react-icons/fa";

const classNameResult = () => {
  return (
    <>
  
    <div className='table'>
     <div className='flex items-center justify-center'>
        <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default  ">
    <table className="w-full text-sm text-left rtl:text-right text-body">
        <thead className="text-sm text-body bg-neutral-secondary-soft border-b rounded-base border-default">
            <tr>
                <th scope="col" className="px-6 py-3 font-medium">
                    Student Name
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                    Class
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                   Section
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                    Exam Name
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                   RollNo
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                   Correct Answers
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                   Wrong Answers 
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                    Unattempted
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                 Total Marks
                </th>
            </tr>
        </thead>
        <tbody>
            <tr className="bg-neutral-primary border-b border-default">
                <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                   Kapil
                </th>
                <td className="px-6 py-4">
                 12th
                </td>
                <td className="px-6 py-4">
                    A
                </td>
                <td className="px-6 py-4">
                   Neet
                </td>
                <td className="px-6 py-4">
                   12
                </td>
                <td className="px-6 py-4">
                   45
                </td>
                <td className="px-6 py-4">
                   12
                </td>
                <td className="px-6 py-4">
                   Attempted
                </td>
                <td className="px-6 py-4">
                     100
                </td>
            </tr>
            <tr className="bg-neutral-primary border-b border-default">
                <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                   Surender
                </th>
                <td className="px-6 py-4">
                 12th
                </td>
                <td className="px-6 py-4">
                    A
                </td>
                <td className="px-6 py-4">
                   Neet
                </td>
                <td className="px-6 py-4">
                   12
                </td>
                <td className="px-6 py-4">
                   --
                </td>
                <td className="px-6 py-4">
                   --
                </td>
                <td className="px-6 py-4">
                  Not Attempted
                </td>
                <td className="px-6 py-4">
                     ---
                </td>
            </tr>
             <tr className="bg-neutral-primary border-b border-default">
                <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                   Gagan
                </th>
                <td className="px-6 py-4">
                 12th
                </td>
                <td className="px-6 py-4">
                    A
                </td>
                <td className="px-6 py-4">
                   Neet
                </td>
                <td className="px-6 py-4">
                   12
                </td>
                <td className="px-6 py-4">
                   45
                </td>
                <td className="px-6 py-4">
                   12
                </td>
                <td className="px-6 py-4">
                   Attempted
                </td>
                <td className="px-6 py-4">
                     100
                </td>
            </tr>
        </tbody>
    </table>
</div>
     </div>
     <div className='printing'> 
        <Button className='!bg-blue-500 !text-white !px-4 !py-2 !rounded-md hover:!bg-blue-600 !mt-4 gap-2'>Download Report<FaPrint className='!text-[14px]' /></Button>
     </div>
    </div>

    </>
  )
}

export default classNameResult
