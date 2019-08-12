// -------------------------------------------------------------
// sleeperApis.js - Sleeper Bot APIs
// -------------------------------------------------------------
/* istanbul ignore file */
module.exports = (logger) => {
	const exports = {};
	const superagent = require('superagent');
	
	exports.getUserByName = (name, cb) => {
		logger.info('getUserByName()...');
		superagent.get('https://api.sleeper.app/v1/user/' + name)
			.set('Content-Type', 'application/json')
			.on('error', (err) => {
				cb(err.response.body);
			})
			.then((res) => {
				if (res.status === 200) {
					cb(null, res.body);
				} else {
					cb(res.body);
				}
			});
	};
	
	exports.getUserById = (id, cb) => {
		logger.info('getUserById()...');
		superagent.get('https://api.sleeper.app/v1/user/' + id)
			.set('Content-Type', 'application/json')
			.on('error', (err) => {
				cb(err.response.body);
			})
			.then((res) => {
				if (res.status === 200) {
					cb(null, res.body);
				} else {
					cb(res.body);
				}
			});
	};
	
	exports.getAllLeaguesForUser = (name, season, cb) => {
		season = (season) ? season : '2019';
		logger.info('getAllLeaguesForUser()...');
		exports.getUserByName(name, (err, user) => {
			if (err) {
				cb(err);
			} else {
				superagent.get('https://api.sleeper.app/v1/user/' + user.user_id + '/leagues/nfl/' + season)
					.set('Content-Type', 'application/json')
					.on('error', (err) => {
						cb(err.response.body);
					})
					.then((res) => {
						if (res.status === 200) {
							cb(null, res.body);
						} else {
							cb(res.body);
						}
					});
			}
		})
	};
	
	exports.getSpecificLeagueForUser = (name, season, leagueName, cb) => {
		season = (season) ? season : '2019';
		leagueName = leagueName.toLowerCase();
		exports.getAllLeaguesForUser(name, season, (err, leagues) => {
			if (err) {
				cb(err);
			} else {
				let foundMatch = 0;
				for (let i = 0; i < leagues.length; i++) {
					const league = leagues[i].name.toLowerCase();
					if (league.includes(leagueName)) {
						foundMatch++;
						cb(null, leagues[i]);
						break;
					}
				}
				if (foundMatch === 0) {
					cb('League name not found for user ' + name);
				}
			}
		})
	};
	
	exports.getAllDraftsForUser = (name, season, cb) => {
		season = (season) ? season : '2019';
		exports.getUserByName(name, (err, user) => {
			if (err) {
				cb(err);
			} else {
				superagent.get('https://api.sleeper.app/v1/user/' + user.user_id + '/drafts/nfl/' + season)
					.set('Content-Type', 'application/json')
					.on('error', (err) => {
						cb(err.response.body);
					})
					.then((res) => {
						if (res.status === 200) {
							cb(null, res.body);
						} else {
							cb(res.body);
						}
					});
			}
		});
	};
	
	exports.getAllPicksInDraftForUser = (name, season, leagueName, cb) => {
		season = (season) ? season : '2019';
		leagueName = leagueName.toLowerCase();
		exports.getAllDraftsForUser(name, season, (err, drafts) => {
			if (err) {
				cb(err);
			} else {
				let draftId = '';
				for (let i = 0; i < drafts.length; i++) {
					const league = drafts[i].metadata.name.toLowerCase();
					if (league.includes(leagueName)) {
						draftId = drafts[i].draft_id;
						break;
					}
				}
				if (draftId === '') {
					cb('Draft not found');
				} else {
					superagent.get('https://api.sleeper.app/v1/draft/' + draftId + '/picks')
						.set('Content-Type', 'application/json')
						.on('error', (err) => {
							cb(err.response.body);
						})
						.then((res) => {
							if (res.status === 200) {
								exports.getUserByName(name, (err2, user) => {
									if (err2) {
										cb(err2);
									} else {
										const playerDrafted = [];
										for (let j = 0; j < res.body.length; j++) {
											if (res.body[j].picked_by === user.user_id) {
												const player = {
													name: res.body[j].metadata.first_name + ' ' + res.body[j].metadata.last_name,
													position: res.body[j].metadata.position,
													team: res.body[j].metadata.team,
													round: res.body[j].round,
													pick: res.body[j].pick_no
												};
												playerDrafted.push(player);
											}
										}
										cb(null, playerDrafted);
									}
								});
								cb(null, res.body);
							} else {
								cb(res.body);
							}
						});
				}
				
			}
		});
	};
	
	
	return exports;
};
