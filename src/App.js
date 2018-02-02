import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { 
	faCaretDown, 
	faCaretUp , 
	faCircleNotch, 
	faTimes,
	faSortAlphaDown,
	faSortAlphaUp,
	faSortAmountDown,
	faSortAmountUp
} from '@fortawesome/fontawesome-free-solid'
import { faHackerNews } from '@fortawesome/fontawesome-free-brands'
import moment from 'moment'
import { sortBy } from 'lodash';
import './App.css';


const DEFAULT_QUERY = 'redux';
const DEFAULT_TAG = 'story'
const DEFAULT_HPP = '30';
const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_TAGS = 'tags='
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const SORTS = {
	NONE: list => list,
	DATE: list => sortBy(list, 'created_at').reverse(),
	COMMENTS: list => sortBy(list, 'num_comments').reverse(),
	POINTS: list => sortBy(list, 'points').reverse(),
};



class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			results: null,
			searchTerm: DEFAULT_QUERY,
			searchTags: DEFAULT_TAG,
			searchKey: '',
			error: null,
			isLoading: false,
			sortKey: 'NONE',
			isSortReverse: false,
		}

		this.needsToSearchTopStories = this. needsToSearchTopStories.bind(this);
		this.setSearchTopStories = this.setSearchTopStories.bind(this);
		this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
		this.fetchFrontPage = this.fetchFrontPage.bind(this);
		this.onDismiss = this.onDismiss.bind(this);
		this.onSearchChange = this.onSearchChange.bind(this);
		this.onSearchSubmit = this.onSearchSubmit.bind(this);
		this.onSort = this.onSort.bind(this);
	}

	onSort(sortKey) {
		const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse
		this.setState({ sortKey, isSortReverse });
	}

	needsToSearchTopStories(searchTerm) {
		return !this.state.results[searchTerm];
	}

	setSearchTopStories(result) {
		const { hits, page, nbPages } = result;
		const { searchKey, results } = this.state;

		const oldHits = results && results[searchKey]
			? results[searchKey].hits
			: [];

		const updatedHits = [ ...oldHits, ...hits ]

		this.setState({ 
			results : {
				...results,
				[searchKey] : { hits: updatedHits, page, nbPages },
			},
			isLoading: false
		});
	}

	fetchSearchTopStories(searchTerm, searchTags, page = 0) {
		this.setState({ isLoading: true, sortKey: 'NONE'});

		fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_TAGS}${searchTags}
		&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
			.then(response => response.json())
			.then(result => this.setSearchTopStories(result))
			.catch(e => this.setState({error: e}));
	}

	fetchFrontPage() {
		this.setState({searchKey: ""});
	}

	componentDidMount() {
		this.fetchSearchTopStories('', 'front_page');
	}


	onDismiss(id) { 
		const {searchKey, results} = this.state;
		const {hits, page} = results[searchKey];

		const updatedHits = hits.filter(item => item.objectID !== id);
		this.setState({ 
			results: {
				...results, 
				[searchKey]: {hits: updatedHits, page} 
			} 
		});
	}

	onSearchChange(event) {
		this.setState({ searchTerm: event.target.value})
	}

	onSearchSubmit(event) {
		const {searchTerm, searchTags} = this.state;
		this.setState({ searchKey: searchTerm });
		if (this.needsToSearchTopStories(searchTerm)) {
			this.fetchSearchTopStories(searchTerm, searchTags);
		}
		event.preventDefault();
	}

	

	render() {
		const { 
			searchTerm, 
			searchTags,
			results, 
			searchKey, 
			error, 
			isLoading, 
			sortKey,
			isSortReverse,
		} = this.state;

		const page = ( 
			results && 
			results[searchKey] &&
			results[searchKey].page 
		) || 0;

		const list = ( 
			results && 
			results[searchKey] &&
			results[searchKey].hits 
		) || [];

		const morePages = ( 
			results && 
			results[searchKey] &&
			results[searchKey].page >= results[searchKey].nbPages - 1
		) || false;

		const debugpages = ( 
			results && 
			results[searchKey] &&
			results[searchKey].page + " - " + results[searchKey].nbPages
		) || false;

		console.log(debugpages)
		console.log(morePages)


		return (
			<div className="page">
				<div className="interactions">
					<Search
						value={searchTerm}
						onChange={this.onSearchChange}
						onSubmit={this.onSearchSubmit}
						homeFunc={this.fetchFrontPage}
					> Search </Search>
					{ error
						? <p>Something went wrong =o</p>
						: <Table 
							list={list}
							searchKey={searchKey}
							sortKey={sortKey}
							isSortReverse={isSortReverse}
							onSort={this.onSort}
							onDismiss={this.onDismiss}
						/>
					}
				</div>
				<div className="interactions">
					{ !morePages &&
						<ButtonWithLoading 
							isLoading={isLoading}
							onClick={() => this.fetchSearchTopStories(searchKey, searchTags, page + 1)}>
							Load More 
							<FontAwesomeIcon icon="caret-down" />
						</ButtonWithLoading>
					}
				</div>
			</div>
		);
	}
}





const Search = ({ value, onChange, onSubmit, children, homeFunc }) =>
	<div className="search-form">
		<button className="home-button" onClick={() => homeFunc('zzz', 'front_page', 0)}>
			<FontAwesomeIcon icon={faHackerNews} className="fa-3x"/>
		</button>
		<form onSubmit={onSubmit} className="search-form">
			<input 
				type="text" 
				value={value}
				onChange={onChange}
			/>
			<button type="submit">
				{children}
			</button>
		</form>
	</div>
	



const Table = ({ list, searchKey, sortKey, isSortReverse, onSort, onDismiss }) => {
	const sortedList = SORTS[sortKey](list);
	const reverseSortedList = isSortReverse
		? sortedList.reverse()
		: sortedList;


	return (
		<div className="table">
			<div className="table-header">
				Sort By:
				<span>
					<Sort sortKey={'DATE'} onSort={onSort} activeSortKey={sortKey}> Date </Sort>
				</span>
				<span>
					<Sort sortKey={'COMMENTS'} onSort={onSort} activeSortKey={sortKey}> Comments </Sort>
				</span>
				<span>
					<Sort sortKey={'POINTS'} onSort={onSort} activeSortKey={sortKey}> Points </Sort>
				</span>
			</div>
			{reverseSortedList.map(item =>
				<div key={item.objectID} className="table-row">
					<span className="row-points">{item.points}</span>
					<span className="row-content">
						<div className="row-title">
							<a href={item.url}>
								<HighlightTitle
									 searchKey={searchKey}
									 title={item.title}
								/>
							</a>
						</div>
						<div>
							<span className="row-author">{item.author}</span> | 
							<span className="row-date">{ moment(item.created_at).fromNow()}</span> |
							<span className="row-comments"> 
								 <a href={"https://news.ycombinator.com/item?id=" + item.objectID}> 
									{ item.num_comments } comments
								</a>
							</span>
						</div>
					</span>
					<span className="row-button">
						<button
							onClick={() => onDismiss(item.objectID)}
							className="button-inline"
						>
							<FontAwesomeIcon icon={faTimes}/>
						</button>
					</span>
				</div>)
			}
		</div>
	);
}

const HighlightTitle = ({searchKey, title}) => {
	const idx = title.toLowerCase().indexOf(searchKey.toLowerCase());
	
	if (idx > -1) {
		return (
		<span>
			{title.slice(0, idx)}
			<span className="row-title-highlight">
				{title.slice(idx, idx + searchKey.length)}
			</span>
			{title.slice(idx + searchKey.length)}
		</span>)
	}
	return title
}
	
const Sort = ({ sortKey, activeSortKey, onSort, children }) => {
	const sortClass = ['button-inline'];

	if(sortKey === activeSortKey) {
		sortClass.push('button-active');
	}

	return (
		<Button onClick={() => onSort(sortKey)} className={sortClass.join(' ')}>
			{children}
			<FontAwesomeIcon icon={faSortAlphaDown}/>
		</Button>
	);
}



const Button = ({ onClick, className = '', children }) =>
	<button
		onClick={onClick}
		className={className}
		type="button"
	> {children} </button>
	
const withLoading = (Component) => ({isLoading, ...rest }) =>
	isLoading
		? <Loading />
		: <Component { ...rest } />

const Loading = () => 
	<div className="loading-icon">
		<FontAwesomeIcon icon={faCircleNotch} rotate={90} className="fa-spin fa-10x"/>
	</div>

const ButtonWithLoading = withLoading(Button)


export default App;
