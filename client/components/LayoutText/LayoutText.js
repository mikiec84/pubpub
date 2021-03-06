import React from 'react';
import PropTypes from 'prop-types';
import Editor from '@pubpub/editor';
import { getResizedUrl } from 'utilities';

require('./layoutText.scss');

const propTypes = {
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* title, html */
};

const LayoutText = function(props) {
	if (!props.content.text && !props.content.title) { return null; }
	const wrapperStyle = {
		textAlign: props.content.align || 'left',
		maxWidth: props.content.width === 'narrow' ? '800px' : 'none',
		margin: props.content.align === 'center' && props.content.width === 'narrow' ? '0 auto' : '0',
	};
	return (
		<div className="layout-text-component">
			<div className="block-content">
				<div className="container">
					{props.content.title &&
						<div className="row">
							<div className="col-12">
								<h2 className="block-title">{props.content.title}</h2>
							</div>
						</div>
					}
					<div className="row">
						<div className="col-12">
							<div style={wrapperStyle}>
								<Editor
									nodeOptions={{
										image: {
											onResizeUrl: (url)=> { return getResizedUrl(url, 'fit-in', '1200x0'); },
										},
									}}
									initialContent={props.content.text || undefined}
									isReadOnly={true}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

LayoutText.propTypes = propTypes;
export default LayoutText;
