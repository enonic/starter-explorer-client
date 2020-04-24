import {search} from '/lib/explorer';

export const get = ({
  params: {
    count = 10,
    q: searchString = ''
  } = {}
}) => ({
  body: search({
    count,
    interface: 'interface-1',
    //name: 'q',
    searchString
  }),
  contentType: 'application/json;charset=utf-8'
});
