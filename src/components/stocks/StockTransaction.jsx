import React from 'react'
import { LuListChecks } from 'react-icons/lu'
import { Link } from 'react-router'

const StockTransition = () => {
  return (
    <section className='px-2 md:px-10 py-5'>
      <article className='flex flex-col gap-5'>
        <div className='flex justify-between'>
          <label className='label text-black text-xl font-bold'>
            <LuListChecks className='text-xl' />តាមដានស្តុក</label>
          <Link to="#" className='block lg:hidden'>
            <button className="btn bg-[#03C755] text-white ml-5 border-[#00b544]">
              Export Excel
            </button>
          </Link>
        </div>
        <nav className='oder-1 col-span-3'>
          <div className="join w-full flex">
            <div className='flex-1'>
              <div>
                <input className="input join-item w-full bg-transparent text-gray-800 border-gray-400 focus:outline-none" placeholder="Search" />
              </div>
            </div>
            <select className="select w-30 md:w-50 join-item bg-transparent text-gray-800 border-gray-400 focus:outline-none">
              <option disabled selected>Filter</option>
              <option>Sci-fi</option>
              <option>Drama</option>
              <option>Action</option>
            </select>
            {/* <div className="indicator">
              <span className="indicator-item badge badge-secondary">new</span>
              <button className="btn join-item">Search</button>
            </div> */}
          <Link to="#" className='hidden lg:block'>
            <button className="btn bg-[#03C755] text-white ml-5 border-[#00b544]">
              Export Excel
            </button>
          </Link>
          </div>
        </nav>
        <div className="overflow-x-auto rounded-box border border-base-300/10 text-gray-600">
          <table className="table">
            {/* head */}
            <thead className='text-gray-700'>
              <tr>
                <th>No</th>
                <th>Brand name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* row 1 */}
              <tr>
                <th>1</th>
                <td>Cy Ganderton</td>
                <td>Quality Control Specialist</td>
               
              </tr>
              {/* row 2 */}
              <tr>
                <th>2</th>
                <td>Hart Hagerty</td>
                <td>Desktop Support Technician</td>
                
              </tr>
              {/* row 3 */}
              <tr>
                <th>3</th>
                <td>Brice Swyre</td>
                <td>Tax Accountant</td>
                
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}

export default StockTransition