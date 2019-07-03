import {search} from '/lib/explorer/client';
//import {toStr} from '/lib/util';
import {dlv as getIn} from '/lib/util/object';
import {sanitize} from '/lib/xp/common';
import {
	getContent as getCurrentContent,
	getSite as getCurrentSite
} from '/lib/xp/portal';


const APP_NAME = sanitize(app.name).replace(/\./g, '-');
//log.info(toStr({APP_NAME}));


export function get({params}) {
	//log.info(toStr({params}));

	const currentContent = getCurrentContent();
	//log.info(toStr({currentContent}));

	const {
		data: {
			interfaceName: currentContentInterfaceName,
			queryParamName
		},
		displayName,
		language
	} = currentContent;
	//log.info(`currentContentInterfaceName:${currentContentInterfaceName}`);
	//log.info(`queryParamName:${queryParamName}`);
	//log.info(`displayName:${displayName}`);
	//log.info(`language:${language}`);

	const {language: siteLang} = getCurrentSite();
	//log.info(`siteLang:${siteLang}`);

	// Using Accept-Language is a bad idea as most browsers set english by default
	const locale = params.locale/* || headers['Accept-Language']*/ || language || siteLang || 'nb-NO';
	//log.info(`locale:${locale}`);

	const name = queryParamName || getIn(currentContent, `x.${APP_NAME}.search.queryParamName`, 'q');
	//log.info(`name:${name}`);

	const searchString = params[name];
	//log.info(`searchString:${searchString}`);

	const xInterfaceName = getIn(currentContent, `x.${APP_NAME}.search.interfaceName`);
	//log.info(`xInterfaceName:${xInterfaceName}`);

	const interfaceName = currentContentInterfaceName || xInterfaceName;
	//log.info(`interfaceName:${interfaceName}`);

	const searchParams = {
		/*count: 10,
		facets: {
			language: params.language,
		},*/
		interface: interfaceName,
		locale,
		name,
		//page,
		searchString
	};
	//log.info(toStr({searchParams}));

	const res = search(searchParams);
	//log.info(toStr({res}));

	return {
		body: res,
		contentType: 'application/json;charset=utf-8'
	}
}
