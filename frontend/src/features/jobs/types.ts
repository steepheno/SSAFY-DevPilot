export interface Job {
  name: string;
  url: string;
  color:
    | 'red'
    | 'red_anime'
    | 'yellow'
    | 'yellow_anime'
    | 'blue'
    | 'blue_anime'
    | 'grey'
    | 'grey_anime'
    | 'disabled'
    | 'disabled_anime'
    | 'aborted'
    | 'aborted_anime'
    | 'notbuilt'
    | 'notbuilt_anime';
}
