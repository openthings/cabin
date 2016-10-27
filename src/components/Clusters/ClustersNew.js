/*
  Copyright 2015 Skippbox, Ltd

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
import Colors from 'styles/Colors';
import ListInputItem from 'components/commons/ListInputItem';
import ListHeader from 'components/commons/ListHeader';
import ClustersActions from 'actions/ClustersActions';
import NavigationActions from 'actions/NavigationActions';
import ScrollView from 'components/commons/ScrollView';
import AlertUtils from 'utils/AlertUtils';
import {GoogleSignin, GoogleSigninButton} from 'react-native-google-signin';
import GoogleCloudActions from 'actions/GoogleCloudActions';

const { PropTypes } = React;

const {
  View,
  StyleSheet,
  DeviceEventEmitter,
} = ReactNative;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  scrollViewContent: {
    marginTop: 20,
  },
});

export default class ClustersNew extends Component {

  static propTypes = {
    cluster: PropTypes.instanceOf(Immutable.Map), // if provided, it will edit cluster instead of create new one
  }

  constructor(props) {
    super(props);
    const { cluster } = props;
    if (cluster) {
      this.state = cluster.toJS();
    } else {
      this.state = {
        url: 'https://',
        name: '',
        username: '',
        password: '',
        token: '',

        googleUser: null,
      };
    }
  }

  componentDidMount() {
    this.submitListener = DeviceEventEmitter.addListener('ClustersNew:submit', this.onSubmit.bind(this));
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      iosClientId: '777344195972-kga2cv236fi3mbkat6a17orm57q8lvdk.apps.googleusercontent.com',
    });
  }

  componentWillUnmount() {
    this.submitListener.remove();
  }

  render() {
    return (
      <View style={styles.flex}>
        <ScrollView style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardDismissMode={'interactive'}
          keyboardShouldPersistTaps={true}>
          <GoogleSigninButton
            style={{flex: 1, height: 48}}
            size={GoogleSigninButton.Size.Standard}
            onPress={this.signInGoogle.bind(this)}/>
          <ListHeader title="Cluster info"/>
          <ListInputItem autoCapitalize="none" autoCorrect={false} defaultValue={this.state.url} placeholder="URL"
            onChangeText={url => this.setState({url})}/>
          <ListInputItem defaultValue={this.state.name} placeholder="Optional name"
            onChangeText={name => this.setState({name})} isLast={true}/>

          <ListHeader title="Authentication" style={{marginTop: 30}}/>
          <ListInputItem autoCapitalize="none" autoCorrect={false} defaultValue={this.state.username} placeholder="Username"
            onChangeText={username => this.setState({username})}/>
          <ListInputItem secureTextEntry={true} autoCapitalize="none" autoCorrect={false} defaultValue={this.state.password} placeholder="Password"
            onChangeText={password => this.setState({password})} isLast={true}/>
          <ListHeader title="Or"/>
          <ListInputItem style={{marginBottom: 20}} autoCapitalize="none" autoCorrect={false} defaultValue={this.state.token} placeholder="Access Token"
            onChangeText={token => this.setState({token})} isLast={true}/>

        </ScrollView>
      </View>
    );
  }

  signInGoogle() {
    GoogleCloudActions.signIn().then(() => {
      return GoogleCloudActions.getProjects();
    }).then(() => {
      return GoogleCloudActions.getZones(alt.stores.GoogleCloudStore.getProjects().getIn(['0', 'projectId']));
    });
  }

  onSubmit() {
    if (!/(ftp|https?):\/\/[^ "]+$/.test(this.state.url)) {
      AlertUtils.showWarning({message: intl('cluster_new_wrong_url')});
      return;
    }
    if (this.props.cluster) {
      ClustersActions.editCluster({cluster: this.props.cluster, params: Immutable.fromJS({...this.state})});
    } else {
      ClustersActions.addCluster({...this.state});
    }
    setTimeout(() => {
      const cluster = alt.stores.ClustersStore.get(this.state.url);
      cluster && ClustersActions.checkCluster(cluster);
    }, 1000);
    NavigationActions.pop();
  }

}
