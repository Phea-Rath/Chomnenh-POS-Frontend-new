import { useState, useRef, useEffect } from 'react';
import RichSearch from './RichSearch';
import DateInput from './DatePicker';
import Input from './Input';
import Button from './Button';
import { FaSearch } from 'react-icons/fa';


export default function WhiteBoard() {
  return (
    <div className='h-screen'>
      <Button variant='primary' outline={true}><FaSearch />Primary</Button>
      <Button variant='success' outline={false}>Success</Button>
      <Button variant='danger' outline={true}>Danger</Button>
    </div>
  )
}