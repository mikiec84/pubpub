import React from 'react';
import Promise from 'bluebird';
import firebaseAdmin from 'firebase-admin';
import Pub from 'containers/Pub/Pub';
import { getFirebaseConfig } from 'utilities';
import Html from '../Html';
import app from '../server';
import { hostIsValid, renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';
import { findPub } from '../queryHelpers';


/* To encode: Buffer.from(JSON.stringify(serviceAccountJson)).toString('base64'); */
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(serviceAccount),
	databaseURL: getFirebaseConfig().databaseURL,
});

app.get(['/pub/:slug', '/pub/:slug/content/:sectionId', '/pub/:slug/draft', '/pub/:slug/draft/content/:sectionId', '/pub/:slug/:mode', '/pub/:slug/:mode/:subMode'], (req, res, next)=> {
	if (!hostIsValid(req, 'community')) { return next(); }

	const isDraftRoute = req.path.indexOf(`/pub/${req.params.slug}/draft`) === 0;
	// const acceptedModes = ['collaborators', 'versions', 'invite', 'discussions', 'contents'];
	const acceptedModes = []; // TODO: remove all mode content from pub.js and Pub.js
	if (req.params.mode && acceptedModes.indexOf(req.params.mode) === -1) { return next(); }


	return getInitialData(req)
	.then((initialData)=> {
		return Promise.all([
			initialData,
			findPub(req, initialData, isDraftRoute)
		]);
	})
	.then(([initialData, pubData])=> {
		/* If isDraft, generate a firebaseToken */
		const tokenClientId = initialData.loginData.clientId || 'anonymous';
		const createFirebaseToken = isDraftRoute
			? firebaseAdmin.auth().createCustomToken(tokenClientId, {
				// localPermissions: pubData.localPermissions,
				isManager: pubData.isManager,
				isDraftEditor: pubData.isDraftEditor,
				isDraftViewer: pubData.isDraftViewer,
				editorKey: `pub-${pubData.id}`,
			})
			: undefined;
		return Promise.all([
			initialData,
			pubData,
			createFirebaseToken
		]);
	})
	.then(([initialData, pubData, firebaseToken])=> {
		/* A pub can be unlisted either because of the collections it is in */
		/* or because there is no privately visible content. For the second */
		/* case, this occurs when there are no visible saved versions and */
		/* the draft is private */
		// const isUnlistedCollection = pubData.pages.reduce((prev, curr)=> {
		// 	if (curr.isPublic) { return false; }
		// 	return prev;
		// }, true);
		const isUnlistedDraft = pubData.versions.length === 0 && pubData.draftPermissions === 'private';

		const newInitialData = {
			...initialData,
			pubData: {
				...pubData,
				// isDraft: isDraft,
				firebaseToken: firebaseToken,
				editorKey: `pub-${pubData.id}`,
			}
		};
		return renderToNodeStream(res,
			<Html
				chunkName="Pub"
				initialData={newInitialData}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: pubData.title,
					description: pubData.description,
					image: pubData.avatar,
					attributions: pubData.attributions,
					publishedAt: pubData.firstPublishedAt,
					doi: pubData.doi,
					// unlisted: isUnlistedCollection || isUnlistedDraft,
					unlisted: isUnlistedDraft,
				})}
			>
				<Pub {...newInitialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});
