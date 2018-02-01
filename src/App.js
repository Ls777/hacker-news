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
import { sortBy } from 'lodash';
import './App.css';


const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '20';
const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_TAGS = 'tags='
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const searchTags = "story"

const SORTS = {
	NONE: list => list,
	TITLE: list => sortBy(list, 'title'),
	AUTHOR: list => sortBy(list, 'author'),
	COMMENTS: list => sortBy(list, 'num_comments').reverse(),
	POINTS: list => sortBy(list, 'points').reverse(),
};



class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			results: null,
			searchTerm: DEFAULT_QUERY,
			searchKey: '',
			error: null,
			isLoading: false,
			sortKey: 'NONE',
			isSortReverse: false,
		}

		this.needsToSearchTopStories = this. needsToSearchTopStories.bind(this);
		this.setSearchTopStories = this.setSearchTopStories.bind(this);
		this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
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
		const {hits, page } = result;
		const { searchKey, results } = this.state;

		const oldHits = results && results[searchKey]
			? results[searchKey].hits
			: [];

		const updatedHits = [ ...oldHits, ...hits ]

		this.setState({ 
			results : {
				...results,
				[searchKey] : { hits: updatedHits, page }
			},
			isLoading: false
		});
	}

	fetchSearchTopStories(searchTerm, page = 0) {
		this.setState({ isLoading: true });

		fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_TAGS}${searchTags}
		&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
			.then(response => response.json())
			.then(result => this.setSearchTopStories(result))
			.catch(e => this.setState({error: e}));
	}
	componentDidMount() {
		const { searchTerm } = this.state;
		this.setState({searchKey: searchTerm});
		this.fetchSearchTopStories(searchTerm);
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
		const {searchTerm} = this.state;
		this.setState({ searchKey: searchTerm });
		if (this.needsToSearchTopStories(searchTerm)) {
			this.fetchSearchTopStories(searchTerm);
		}
		event.preventDefault();
	}

	

	render() {
		const { 
			searchTerm, 
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


		return (
			<div className="page">
				<div className="interactions">
					<Search
						value={searchTerm}
						onChange={this.onSearchChange}
						onSubmit={this.onSearchSubmit}
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
					<ButtonWithLoading 
						isLoading={isLoading}
						onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
						Load More 
						<FontAwesomeIcon icon={faCaretDown} />
					</ButtonWithLoading>
				</div>
			</div>
		);
	}
}





const Search = ({ value, onChange, onSubmit, children }) =>
	<form onSubmit={onSubmit}>
		<input 
			type="text" 
			value={value}
			onChange={onChange}
		/>
		<button type="submit">
			{children}
		</button>
	</form>
	



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
					<Sort sortKey={'TITLE'} onSort={onSort} activeSortKey={sortKey}> Title </Sort>
				</span>
				<span>
					<Sort sortKey={'AUTHOR'} onSort={onSort} activeSortKey={sortKey}> Author </Sort>
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
