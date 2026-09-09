import * as React from 'react';
import { useEffect } from 'react';
import './css/Modal.css'

const Modal = ({ handleClose, show, className = '', children }) => {
    useEffect(() => {
      if (!show || !handleClose) return undefined;
      const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [show, handleClose]);

    /*
    Backdrop and Esc close only when the caller supplies handleClose. The
    create-session and create-board modals hold a half-filled form and pass
    nothing, so a stray click outside one still cannot throw it away.
    */
    const onBackdrop = handleClose
      ? (e) => { if (e.target === e.currentTarget) handleClose(); }
      : undefined;

    const showHideClassName = show ? 'modal display-block' : 'modal display-none';
    return (
      <div
        className={showHideClassName + (className ? ' ' + className : '')}
        onClick={onBackdrop}
      >
        <section className='modal-main'>
          {children}
        </section>
      </div>
    );
  };
  export default Modal;
