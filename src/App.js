import React, { Component } from 'react';
import { sortBy } from 'lodash';
import './App.css';


const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '100';
const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

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

		fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}\
		${page}&${PARAM_HPP}${DEFAULT_HPP}`)
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
						More
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
	



const Table = ({ list, sortKey, isSortReverse, onSort, onDismiss }) => {
	const sortedList = SORTS[sortKey](list);
	const reverseSortedList = isSortReverse
		? sortedList.reverse()
		: sortedList;

	return (
		<div className="table">
			<div className="table-header">
				<span style={{ width: '40%'}}>
					<Sort sortKey={'TITLE'} onSort={onSort} activeSortKey={sortKey}> Title </Sort>
				</span>
				<span style={{ width: '30%'}}>
					<Sort sortKey={'AUTHOR'} onSort={onSort} activeSortKey={sortKey}> Author </Sort>
				</span>
				<span style={{ width: '10%'}}>
					<Sort sortKey={'COMMENTS'} onSort={onSort} activeSortKey={sortKey}> Comments </Sort>
				</span>
				<span style={{ width: '10%'}}>
					<Sort sortKey={'POINTS'} onSort={onSort} activeSortKey={sortKey}> Points </Sort>
				</span>
				<span style={{ width: '10%'}}>
					Archive
				</span>
			</div>
			{reverseSortedList.map(item =>
				<div key={item.objectID} className="table-row">
					<span style={{ width: '40%' }}>
						<a href={item.url}>{item.title}</a>
					</span>
					<span style={{ width: '30%' }}>{item.author}</span>
					<span style={{ width: '10%' }}>{item.num_comments}</span>
					<span style={{ width: '10%' }}>{item.points}</span>
					<span style={{ width: '10%' }}>
						<button
							onClick={() => onDismiss(item.objectID)}
							className="button-inline"
						>
							Dismiss Me
						</button>
					</span>
				</div>)
			}
		</div>
	);
}
	
const Sort = ({ sortKey, activeSortKey, onSort, children }) => {
	const sortClass = ['button-inline'];

	if(sortKey === activeSortKey) {
		sortClass.push('button-active');
	}

	return (
		<Button onClick={() => onSort(sortKey)} className={sortClass.join(' ')}>
			{children}
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
	<div>Loading...</div>

const ButtonWithLoading = withLoading(Button)


export default App;
