import React, { useCallback, useState, useMemo } from 'react';
import Head from 'next/head';
import { Paper, Grid, Typography, TextField, Button } from '@material-ui/core';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { FormType } from '../types';
import { auth } from '../lib/firebase';
import { redirectMainIfUserExist } from '../context/auth';
import { useAlert } from '../context/alert';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      height: '100vh',
    },
    form: {
      width: 300,
      height: 350,
      padding: 8,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    title: {
      textAlign: 'center',
      marginBottom: 8,
    },
    btnGroups: {
      marginTop: 12,
      rowGap: 8,
      display: 'flex',
    },
    formElmt: {
      width: '80%',
      marginBottom: 4,
    },
  })
);

function SignInForm({ onFormTypeToggle }) {
  const classes = useStyles();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formInput, setFormInput] = useState<{
    email: string;
    password: string;
  }>({
    email: '',
    password: '',
  });
  const { showErrorMsg } = useAlert();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.name;

      setFormInput({
        ...formInput,
        [name]: e.target.value,
      });
    },
    [formInput]
  );

  const handleSignIn = useCallback(() => {
    setLoading(true);
    signInWithEmailAndPassword(auth, formInput.email, formInput.password)
      .then(() => {
        router.push('/main');
      })
      .catch((error) => {
        showErrorMsg(error.message);
        setLoading(false);
      });
  }, [formInput]);

  const handleEnterSubmit = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && handleSignIn) handleSignIn();
    },
    [handleSignIn]
  );

  return (
    <Grid
      container
      direction="row"
      justifyContent="center"
      alignItems="center"
      className={classes.container}
    >
      <Paper variant="outlined" className={classes.form}>
        <Typography variant="h4" component="h2" className={classes.title}>
          Sign In
        </Typography>
        <form>
          <TextField
            required
            id="outlined-required"
            label="Email"
            name="email"
            onChange={handleInputChange}
            onKeyPress={handleEnterSubmit}
            className={classes.formElmt}
          />
          <TextField
            required
            id="outlined-required"
            label="Password"
            type="password"
            name="password"
            onChange={handleInputChange}
            onKeyPress={handleEnterSubmit}
            className={classes.formElmt}
          />
          <Grid
            container
            direction="column"
            alignItems="center"
            className={classes.btnGroups}
          >
            <Button
              variant="contained"
              color="primary"
              className={classes.formElmt}
              onClick={handleSignIn}
              disabled={loading}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              color="secondary"
              className={classes.formElmt}
              onClick={onFormTypeToggle}
              disabled={loading}
            >
              Sign Up
            </Button>
          </Grid>
        </form>
      </Paper>
    </Grid>
  );
}

function SignUpForm({ onFormTypeToggle }) {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [formInput, setFormInput] = useState<{
    email: string;
    password: string;
    passwordConfirmation: string;
  }>({
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const { showErrorMsg, showSuccessMsg } = useAlert();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.name;

      setFormInput({
        ...formInput,
        [name]: e.target.value,
      });
    },
    [formInput]
  );

  const handleSignUp = useCallback(() => {
    if (formInput.password !== formInput.passwordConfirmation) {
      showErrorMsg('Two Passwords are different.');
      return;
    }

    setLoading(true);
    createUserWithEmailAndPassword(auth, formInput.email, formInput.password)
      .then(() => {
        showSuccessMsg('Succeeded to sign up');
        if (onFormTypeToggle) onFormTypeToggle();
      })
      .catch((error) => {
        setLoading(false);
        showErrorMsg(error.message);
      });
  }, [onFormTypeToggle, formInput]);

  const handleEnterSubmit = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && handleSignUp) handleSignUp();
    },
    [handleSignUp]
  );

  return (
    <Grid
      container
      direction="row"
      justifyContent="center"
      alignItems="center"
      className={classes.container}
    >
      <Paper variant="outlined" className={classes.form}>
        <Typography variant="h4" component="h2" className={classes.title}>
          Sign Up
        </Typography>
        <form>
          <TextField
            required
            id="outlined-required"
            label="Email"
            name="email"
            onChange={handleInputChange}
            onKeyPress={handleEnterSubmit}
            className={classes.formElmt}
          />
          <TextField
            required
            id="outlined-required"
            label="Password"
            type="password"
            name="password"
            onChange={handleInputChange}
            onKeyPress={handleEnterSubmit}
            className={classes.formElmt}
          />
          <TextField
            required
            id="outlined-required"
            label="Password Confirmation"
            type="password"
            name="passwordConfirmation"
            onChange={handleInputChange}
            onKeyPress={handleEnterSubmit}
            className={classes.formElmt}
          />
          <Grid
            container
            direction="column"
            alignItems="center"
            className={classes.btnGroups}
          >
            <Button
              variant="contained"
              color="primary"
              className={classes.formElmt}
              onClick={handleSignUp}
              disabled={loading}
            >
              Sign Up
            </Button>
            <Button
              variant="contained"
              color="secondary"
              className={classes.formElmt}
              onClick={onFormTypeToggle}
              disabled={loading}
            >
              Sign In
            </Button>
          </Grid>
        </form>
      </Paper>
    </Grid>
  );
}

function Login() {
  const [formType, setFormType] = useState<FormType>('SIGN_IN');
  const handleFormTypeToggle = useCallback(() => {
    setFormType(formType === 'SIGN_IN' ? 'SIGN_UP' : 'SIGN_IN');
  }, [formType]);

  const form = useMemo(() => {
    if (formType === 'SIGN_IN') {
      return <SignInForm onFormTypeToggle={handleFormTypeToggle} />;
    } else {
      return <SignUpForm onFormTypeToggle={handleFormTypeToggle} />;
    }
  }, [formType]);

  redirectMainIfUserExist();

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      {form}
    </>
  );
}

export default Login;
