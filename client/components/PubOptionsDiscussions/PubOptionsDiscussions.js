import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox } from '@blueprintjs/core';
import PubOptionsSharingCard from 'components/PubOptionsSharingCard/PubOptionsSharingCard';
import UserAutocomplete from 'components/UserAutocomplete/UserAutocomplete';
import Avatar from 'components/Avatar/Avatar';
import Icon from 'components/Icon/Icon';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import { apiFetch } from 'utilities';

require('./pubOptionsDiscussions.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsDiscussions extends Component {
	constructor(props) {
		super(props);
		this.state = {
			pubData: props.pubData,
			newChannelTitle: '',
		};
		this.handleChannelAdd = this.handleChannelAdd.bind(this);
		this.handleChannelUpdate = this.handleChannelUpdate.bind(this);
		this.handleChannelParticipantAdd = this.handleChannelParticipantAdd.bind(this);
		this.handleChannelParticipantDelete = this.handleChannelParticipantDelete.bind(this);
	}

	handleChannelAdd(evt) {
		evt.preventDefault();
		return apiFetch('/api/discussionChannels', {
			method: 'POST',
			body: JSON.stringify({
				title: this.state.newChannelTitle,
				pubId: this.state.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((newDiscussionChannel)=> {
			const newPubData = {
				...this.state.pubData,
				discussionChannels: [
					newDiscussionChannel,
					...this.state.pubData.discussionChannels
				],
			};
			this.setState({
				newChannelTitle: '',
				pubData: newPubData,
			});
			this.props.setPubData(newPubData);
		})
		.catch((err)=> {
			console.error('Error creating discussion channel', err);
		});
	}

	handleChannelUpdate(updatedChannelObject) {
		return apiFetch('/api/discussionChannels', {
			method: 'PUT',
			body: JSON.stringify({
				...updatedChannelObject,
				pubId: this.state.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((newDiscussionChannelData)=> {
			const newPubData = {
				...this.state.pubData,
				discussionChannels: this.state.pubData.discussionChannels.map((channel)=> {
					if (channel.id !== updatedChannelObject.discussionChannelId) { return channel; }
					return {
						...channel,
						...newDiscussionChannelData,
					};
				})
			};
			this.setState({ pubData: newPubData });
			this.props.setPubData(newPubData);
		})
		.catch((err)=> {
			console.error('Error updated discussion channel', err);
		});
	}

	handleChannelParticipantAdd(newChannelParticipant) {
		return apiFetch('/api/discussionChannelParticipants', {
			method: 'POST',
			body: JSON.stringify({
				...newChannelParticipant,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			const newPubData = {
				...this.state.pubData,
				discussionChannels: this.state.pubData.discussionChannels.map((channel)=> {
					if (channel.id !== newChannelParticipant.discussionChannelId) { return channel; }
					return {
						...channel,
						participants: [
							...channel.participants,
							result
						]
					};
				})
			};
			this.setState({ pubData: newPubData });
			this.props.setPubData(newPubData);
		});
	}

	handleChannelParticipantUpdate(channelParticipantUpdates) {
		const newPubData = {
			...this.state.pubData,
			discussionChannels: this.state.pubData.discussionChannels.map((channel)=> {
				return {
					...channel,
					participants: channel.participants.map((participant)=> {
						if (participant.id !== channelParticipantUpdates.discussionChannelParticipantId) { return participant; }
						return {
							...participant,
							...channelParticipantUpdates
						};
					})
				};
			})
		};
		this.setState({ pubData: newPubData });
		return apiFetch('/api/discussionChannelParticipants', {
			method: 'PUT',
			body: JSON.stringify({
				...channelParticipantUpdates,
				communityId: this.props.communityData.id,
			})
		})
		.then(()=> {
			// this.setState({ isLoading: false });
			this.props.setPubData(newPubData);
		});
	}

	handleChannelParticipantDelete(channelId, channelParticipantId) {
		const newPubData = {
			...this.state.pubData,
			discussionChannels: this.state.pubData.discussionChannels.map((channel)=> {
				return {
					...channel,
					participants: channel.participants.filter((participant)=> {
						return participant.id !== channelParticipantId;
					})
				};
			})
		};
		this.setState({ pubData: newPubData });
		return apiFetch('/api/discussionChannelParticipants', {
			method: 'DELETE',
			body: JSON.stringify({
				discussionChannelId: channelId,
				discussionChannelParticipantId: channelParticipantId,
				communityId: this.props.communityData.id,
			})
		})
		.then(()=> {
			// this.setState({ isLoading: false });
			this.props.setPubData(newPubData);
		});
	}

	render() {
		const pubData = this.props.pubData;
		// TODO: Only allow options on channels you moderate
		const channels = [
			{
				id: undefined,
				title: 'public',
				permissions: 'public',
				isCommunityAdminModerated: true,
				participants: [],
			},
			...pubData.discussionChannels
		];
		const channelPermissionOptions = [
			{ value: 'private', title: 'Private', description: 'Private View. Private Write' },
			{ value: 'restricted', title: 'Restricted', description: 'Public View. Private Write' },
			{ value: 'public', title: 'Public', description: 'Public View. Public Write' },
		];
		return (
			<div className="pub-options-discussions-component">
				<h1>Discussion Channels</h1>
				<form onSubmit={this.handleChannelAdd}>
					<input
						type="text"
						className="pt-input pt-fill"
						placeholder="New Discussion Channel Title..."
						value={this.state.newChannelTitle}
						onChange={(evt)=> {
							this.setState({ newChannelTitle: evt.target.value.replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/gi, '').toLowerCase() });
						}}
					/>
				</form>

				<div className="channels">
					{channels.map((channel)=> {
						const canModerate = channel.participants.reduce((prev, curr)=> {
							if (curr.userId === this.props.loginData.id) { return true; }
							return prev;
						}, channel.isCommunityAdminModerated && this.props.loginData.isAdmin);
						return (
							<div className="channel" key={`channel-${channel.id}`}>
								<div className="header">
									<div className="title">
										#{channel.title}
									</div>
									<div className="option">
										{!channel.id &&
											<span className="static">public</span>
										}
										{!canModerate && channel.id &&
											<span className="static">{channel.permissions}</span>
										}

										{/* Permissions Dropdown for channels other than #public */}
										{canModerate && channel.id &&
											<DropdownButton
												label={channel.permissions}
												// icon={items[props.value].icon}
												isRightAligned={true}
											>
												<ul className="channel-permissions-dropdown pt-menu">
													{channelPermissionOptions.map((option)=> {
														return (
															<li key={`permissions-${option.value}`}>
																<button
																	className="pt-menu-item pt-popover-dismiss"
																	onClick={()=> {
																		this.handleChannelUpdate({
																			discussionChannelId: channel.id,
																			permissions: option.value,
																		});
																	}}
																	type="button"
																>
																	<div className="title">{option.title}</div>
																	<div className="description">{option.description}</div>
																</button>
															</li>
														);
													})}
												</ul>
											</DropdownButton>
										}
									</div>
								</div>
								<div>
									{canModerate &&
										<div className="cards-wrapper">
											{/* If community admins are not managers, show options for their permissions */}
											<PubOptionsSharingCard
												content={[
													<span className="pt-icon-standard pt-icon-people" />,
													<span>Community Admins</span>
												]}
												options={(
													<Checkbox
														checked={channel.isCommunityAdminModerated}
														onChange={(evt)=> {
															this.handleChannelUpdate({
																discussionChannelId: channel.id,
																isCommunityAdminModerated: evt.target.checked,
															});
														}}
														disabled={!channel.id}
													>
														Can Moderate
													</Checkbox>
												)}
											/>

											{/* List all version permissions, filtering out managers */}
											{channel.participants.sort((foo, bar)=> {
												if (foo.createdAt < bar.createdAt) { return -1; }
												if (foo.createdAt > bar.createdAt) { return 1; }
												return 0;
											}).map((participant)=> {
												return (
													<PubOptionsSharingCard
														key={participant.id}
														content={[
															<Avatar width={25} userInitials={participant.user.initials} userAvatar={participant.user.avatar} />,
															<span>{participant.user.fullName}</span>
														]}
														options={[
															<Checkbox
																checked={participant.isModerator}
																onChange={(evt)=> {
																	this.handleChannelParticipantUpdate({
																		discussionChannelParticipantId: participant.id,
																		discussionChannelId: channel.id,
																		isModerator: evt.target.checked,
																	});
																}}
															>
																Can Moderate
															</Checkbox>,
															<button
																className="pt-button pt-minimal pt-small"
																type="button"
																onClick={()=> {
																	this.handleChannelParticipantDelete(channel.id, participant.id);
																}}
															>
																<span className="pt-icon-standard pt-icon-small-cross" />
															</button>
														]}
													/>
												);
											})}

											{/* Card for adding new user to channel. Not used for #public */}
											{channel.id &&
												<PubOptionsSharingCard
													content={
														<UserAutocomplete
															onSelect={(user)=> {
																return this.handleChannelParticipantAdd({
																	userId: user.id,
																	discussionChannelId: channel.id,
																});
															}}
															allowCustomUser={false} // Eventually use this for emails
															placeholder={`Add participant to #${channel.title}...`}
															usedUserIds={channel.participants.map((item)=> {
																return item.user.id;
															})}
														/>
													}
													isAddCard={true}
												/>
											}
										</div>
									}
									{!canModerate &&
										<div className="access-preview">
											{channel.isCommunityAdminModerated &&
												<Icon icon="people" />
											}
											{channel.participants.map((item)=> {
												return <Avatar width={20} userInitials={item.user.initials} userAvatar={item.user.avatar} />;
											})}
										</div>
									}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
}

PubOptionsDiscussions.propTypes = propTypes;
export default PubOptionsDiscussions;
