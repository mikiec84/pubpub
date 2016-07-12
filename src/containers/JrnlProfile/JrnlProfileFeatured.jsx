import React, {PropTypes} from 'react';
import Radium from 'radium';
import Helmet from 'react-helmet';
import {safeGetInToJS} from 'utils/safeParse';
import {PreviewCard} from 'components';

// import {globalStyles} from 'utils/styleConstants';
// import {globalMessages} from 'utils/globalMessages';
// import {FormattedMessage} from 'react-intl';

let styles = {};

export const JrnlProfileFeatured = React.createClass({
	propTypes: {
		jrnlData: PropTypes.object,
	},


	render: function() {
		const jrnlData = safeGetInToJS(this.props.jrnlData, ['jrnlData']) || {};
		const featuredData = safeGetInToJS(this.props.jrnlData, ['featuredData']) || [];
		const metaData = {
			title: 'Featured · ' + jrnlData.jrnlName,
		};

		return (
			<div>
				<Helmet {...metaData} />				

				{
					featuredData.sort((foo, bar)=>{
						// Sort so that most recent is first in array
						if (foo.createDate > bar.createDate) { return -1; }
						if (foo.createDate < bar.createDate) { return 1;}
						return 0;
					}).map((item, index)=>{
						return (
							<PreviewCard 
								key={'featured-' + index}
								image={item.destination.previewImage}
								title={item.destination.title}
								description={item.destination.description} 
								header={<div>Featured on {item.createDate}</div>}/>
						);
					})
				}
				
				
			</div>
		);
	}
});

export default Radium(JrnlProfileFeatured);

styles = {
	
};
