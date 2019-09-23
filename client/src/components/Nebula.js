import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import IconButton from '@material-ui/core/IconButton';
import { ChatBubbleOutline } from '@material-ui/icons';

const styles = _ => ({
  button: {
    zIndex: 1000,
    position: 'fixed',
    bottom: 60,
    right: 20
  },
  popup: {
    zIndex: 1000,
    position: 'fixed',
    top: 100,
    right: 20
  },
  icon: {
    fontSize: 52
  }
});

function Nebula({ classes, chat, isOpen, onOpenClick }) {
  // const [isOpen, setIsOpen] = useState(false);
  const [openChat, setOpenChat] = useState(null);

  useEffect(() => {
    if (chat !== openChat) {
      setOpenChat(chat);
      // setIsOpen(true);
      document.getElementById('nebula-dapp').contentWindow.postMessage({
        type: '@NEBULA::CHAT_OPEN',
        publicKey: chat
      }, 'http://nebuladapp.net');
    }
  }, [chat, openChat]);

  return (
    <>
      <div className={classes.popup} style={{ display: isOpen ? 'block' : 'none' }}>
        <iframe id='nebula-dapp'
          title='nebula dapp'
          src='http://nebuladapp.net?narrow=true&home=/messager&pss=ws://77.120.119.9:8547'
          width='300' height='500'
          frameBorder='0'
          sandbox='allow-scripts allow-same-origin'>
        </iframe>
      </div>
      <div className={classes.button}>
        <IconButton className={classes.open} onClick={() => { onOpenClick(!isOpen) }}>
          <ChatBubbleOutline className={classes.icon} />
        </IconButton>
      </div>
    </>
  )
}

Nebula.propTypes = {
  classes: PropTypes.object.isRequired,
  onOpenClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  chat: PropTypes.string
};

export default withStyles(styles)(Nebula);