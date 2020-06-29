import React, { Component } from 'react';
import { ApolloProvider, Mutation, Query } from "react-apollo"
import client from "./client"
import { SEARCH_REPOSITORIES, ADD_STAR, REMOVE_STAR } from "./graphql"

const StarButton = props => {
    const { node, query, first, last, before, after} = props
    const totalCount = node.stargazers.totalCount
    const viewerHasStarred = node.viewerHasStarred
    const starCount = totalCount === 1 ? "1 star" : `${totalCount} stars`
    const StarStatus = ({addOrRemoveStar}) => {
        return (
            <button
                onClick={
                    () => {
                        addOrRemoveStar({
                            variables: { input: { starrableId: node.id }}
                        })
                    }
                }
            >
                {starCount} | { viewerHasStarred ? "stared" : "-" }
            </button>
        )
    }
    return <Mutation
                mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
                refetchQueries={ mutationResult => {
                    console.log(mutationResult)
                    return  [
                        {
                            query: SEARCH_REPOSITORIES,
                            variables: {query, first, last, before, after}
                        }
                    ]
                }
                }
            >
        {
            addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar} />
        }
    </Mutation>
}

const PER_PAGE = 5
const DEFAULT_STATE = {
    first: 5,
    after: null,
    last: null,
    before: null,
    query: "フロントエンドエンジニア"
}
class App extends Component {
    constructor(props) {
        super(props)
        this.state = DEFAULT_STATE

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleChange(event) {
        this.setState({
            ...DEFAULT_STATE,
            query: event.target.value
        })
    }

    handleSubmit(event) {
        event.preventDefault()
    }

    goNext(search) {
        this.setState ({
            first: PER_PAGE,
            after: search.pageInfo.endCursor,
            last: null,
            before: null
        })
    }

    goPrevious(search) {
        this.setState ({
            first: null,
            after: null,
            last: PER_PAGE,
            before: search.pageInfo.startCursor
        })
    }

    render() {
        const { query, first, last, before, after } = this.state
        return (
        <ApolloProvider client={client}>
            <div>Hola, GraphQL</div>
            <form onSubmit={this.handleSubmit}>
                <input value={query} onChange={this.handleChange} />
            </form>

            <Query query={SEARCH_REPOSITORIES} variables={{query, first, last, before, after}}>
            {
                ({ loading, error, data }) => {
                    if (loading) return 'Loading...'
                    if (error) return `Error! ${error.message}`
                    console.log(data)
                    const search = data.search
                    const repositoryCount = search.repositoryCount
                    const repositoryUnit = repositoryCount === 1 ? "Repository": "Repositories"
                    const title = `Github Repositorys Search Results = ${data.search.repositoryCount} ${repositoryUnit}`
                    return (
                        <React.Fragment>
                            <h2>{title}</h2>
                            <ul>
                                {
                                    search.edges.map(edge => {
                                        const node = edge.node
                                        return (
                                            <li key={node.id}>
                                                <a href={node.url} target="_blank" rel="noopener noreferrer">{node.name}</a>
                                                &nbsp;
                                                <StarButton node={node} {...{ query, query, first, last, before, after}}/>
                                            </li>
                                        )
                                    })
                                }
                            </ul>
                            {search.pageInfo.hasNextPage && (
                                <button onClick={this.goNext.bind(this, search)}>Next</button>
                            )}
                            {search.pageInfo.hasPreviousPage && (
                                <button onClick={this.goPrevious.bind(this, search)}>Previous</button>
                            )}
                        </React.Fragment>
                    )
                }
            }
            </Query>
        </ApolloProvider>
        )
    }
}

export default App;
