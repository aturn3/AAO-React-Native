// @flow

import * as React from 'react'
import glamorous, {View} from 'glamorous-native'
import {BaseText, Paragraph} from './formatting'

// the list itself
export const List = glamorous(View)({})

// the list item's text
export const ListText = glamorous(Paragraph)({
	flex: 1,
})

// the list item's container box thing
type Props = {
	children?: React.Node,
}

export class ListItem extends React.PureComponent<Props> {
	render() {
		return (
			<glamorous.View flexDirection="row">
				<Text>• </Text>
				<ListText {...this.props} />
			</glamorous.View>
		)
	}
}
